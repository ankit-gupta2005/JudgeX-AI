require("dotenv").config();
const { Worker } = require("bullmq");
const Redis = require("ioredis");
const Docker = require("dockerode");
const fs = require("fs").promises;
const path = require("path");
const mongoose = require("mongoose");
const Submission = require("../model/submission.model");
const Problem = require("../model/problem.model");
const connectDB = require("../config/db");
const ContestParticipant = require("../model/contestParticipant.model");

const redisConnection = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null
});
const redisPublisher = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

const renameJavaDriverClass = (driverCode, newClassName) => {
  const publicClassRegex = /public\s+class\s+\w+/;
  if (publicClassRegex.test(driverCode)) {
    return driverCode.replace(publicClassRegex, `public class ${newClassName}`);
  }
  return driverCode.replace(/class\s+Main\b/, `public class ${newClassName}`);
};

const runContainer = async (language, code, rawInput, timeLimit, memoryLimit, driverCode) => {
  const input = rawInput.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const hostTmpDir = path.join(__dirname, "../tmp");
  await fs.mkdir(hostTmpDir, { recursive: true });

  const uniqueId = new mongoose.Types.ObjectId().toString();
  let filename = "";
  let runCommand = [];
  let image = "";
  let className = "";

  const inputFilename = `input_${uniqueId}.txt`;
  await fs.writeFile(path.join(hostTmpDir, inputFilename), input.trim() + "\n");

  if (language === "javascript") {
    filename = `script_${uniqueId}.js`;
    image = "node:18-alpine";
    runCommand = ["node", `/app/${filename}`];

    const defaultJsWrapper = `const fs = require('fs');
${code}
try {
    const rawInput = fs.readFileSync('/app/${inputFilename}', 'utf-8').trim();
    if (!rawInput) process.exit(0);
    const parsedArgs = rawInput.split('\\n').filter(line => line.trim()).map(line => JSON.parse(line.trim()));
    const result = solution(...parsedArgs);
    console.log(JSON.stringify(result));
} catch (err) {
    process.stderr.write(err.message);
    process.exit(1);
}
`;
    const unifiedJsWrapper = driverCode ? `${code}\n${driverCode.replace(/input_\w+\.txt/g, inputFilename)}` : defaultJsWrapper;
    await fs.writeFile(path.join(hostTmpDir, filename), unifiedJsWrapper);

  } else if (language === "python") {
    filename = `script_${uniqueId}.py`;
    image = "python:3.10-alpine";
    runCommand = ["python", `/app/${filename}`];

    const expectedArgsCount = input.split("\n").filter(line => line.trim()).length || 1;
    const defaultPythonWrapper = `import json
import ast

${code}

if __name__ == "__main__":
    try:
        with open('/app/${inputFilename}', 'r') as f:
            raw_input_lines = [line.strip() for line in f.readlines() if line.strip()]

        parsed_args = []
        for line in raw_input_lines[:${expectedArgsCount}]:
            try:
                val = json.loads(line)
            except Exception:
                try:
                    val = ast.literal_eval(line)
                except Exception:
                    val = line
            parsed_args.append(val)

        result = solution(*parsed_args)
        print(json.dumps(result))
    except Exception as err:
        import sys
        print(str(err), file=sys.stderr)
        sys.exit(1)
`;
    const unifiedPythonWrapper = driverCode ? `${code}\n${driverCode.replace(/input_\w+\.txt/g, inputFilename)}` : defaultPythonWrapper;
    await fs.writeFile(path.join(hostTmpDir, filename), unifiedPythonWrapper);

  } else if (language === "cpp") {
    filename = `script_${uniqueId}.cpp`;
    image = "frolvlad/alpine-gxx";
    runCommand = [
      "sh",
      "-c",
      `g++ -std=c++17 -O2 /app/${filename} -o /app/${uniqueId} && /app/${uniqueId} < /app/${inputFilename}`
    ];

    const defaultCppHarness = `#include <bits/stdc++.h>
using namespace std;

${code}

int main() {
    string arrayLine;
    getline(cin, arrayLine);
    arrayLine.erase(remove(arrayLine.begin(), arrayLine.end(), '['), arrayLine.end());
    arrayLine.erase(remove(arrayLine.begin(), arrayLine.end(), ']'), arrayLine.end());
    arrayLine.erase(remove(arrayLine.begin(), arrayLine.end(), ' '), arrayLine.end());
    vector<int> nums;
    stringstream ss(arrayLine);
    string token;
    while (getline(ss, token, ',')) {
        if (!token.empty()) nums.push_back(stoi(token));
    }
    int target;
    cin >> target;
    Solution solver;
    vector<int> result = solver.solution(nums, target);
    cout << "[";
    for (int i = 0; i < (int)result.size(); i++) {
        if (i > 0) cout << ",";
        cout << result[i];
    }
    cout << "]" << endl;
    return 0;
}
`;
    const cppHarness = driverCode ? `#include <bits/stdc++.h>\nusing namespace std;\n${code}\n${driverCode}` : defaultCppHarness;
    await fs.writeFile(path.join(hostTmpDir, filename), cppHarness);

  } else if (language === "java") {
    className = `Solution_${uniqueId}`;
    filename = `${className}.java`;
    image = "eclipse-temurin:17-jdk-focal";
    runCommand = [
      "sh",
      "-c",
      `javac /app/${filename} && java -cp /app ${className} < /app/${inputFilename}`
    ];

    const defaultJavaHarness = `import java.io.*;
import java.util.*;

${code}

public class ${className} {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String arrayLine = br.readLine();
        String targetLine = br.readLine();
        if (arrayLine == null || targetLine == null) return;
        arrayLine = arrayLine.replace("[", "").replace("]", "").replace(" ", "").trim();
        String[] tokens = arrayLine.isEmpty() ? new String[0] : arrayLine.split(",");
        int[] nums = new int[tokens.length];
        for (int i = 0; i < tokens.length; i++) {
            nums[i] = Integer.parseInt(tokens[i]);
        }
        int target = Integer.parseInt(targetLine.trim());
        Solution solver = new Solution();
        int[] result = solver.solution(nums, target);
        System.out.print("[");
        for (int i = 0; i < result.length; i++) {
            System.out.print(result[i]);
            if (i < result.length - 1) System.out.print(",");
        }
        System.out.println("]");
    }
}
`;
    const javaHarness = driverCode
      ? `${code}\n${renameJavaDriverClass(driverCode, className)}`
      : defaultJavaHarness;
    await fs.writeFile(path.join(hostTmpDir, filename), javaHarness);

  } else {
    throw new Error("Unsupported runtime language configuration.");
  }

  try {
    await docker.pull(image);
  } catch (err) {}

  const containerConfig = {
    Image: image,
    Cmd: runCommand,
    AttachStdin: false,
    AttachStdout: true,
    AttachStderr: true,
    OpenStdin: false,
    Tty: false,
    HostConfig: {
      Binds: [`${hostTmpDir}:/app`],
      Memory: memoryLimit * 1024 * 1024,
      MemorySwap: memoryLimit * 1024 * 1024,
      NetworkMode: "none"
    }
  };

  const startTime = Date.now();
  let container;
  let timeoutId;
  let isTimedOut = false;

  try {
    container = await docker.createContainer(containerConfig);
    await container.start();

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(async () => {
        isTimedOut = true;
        try { await container.kill(); } catch {}
        reject(new Error("TLE"));
      }, timeLimit);
    });

    await Promise.race([container.wait(), timeoutPromise]);
    clearTimeout(timeoutId);

    const runtime = Date.now() - startTime;

    let logBuffer = Buffer.alloc(0);
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise(r => setTimeout(r, 40));
      try {
        const raw = await container.logs({ stdout: true, stderr: true, timestamps: false });
        logBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw, "utf8");
        if (logBuffer.length > 0) break;
      } catch {}
    }

    let stdoutStr = "";
    let stderrStr = "";

    if (logBuffer.length > 0) {
      const firstByte = logBuffer.readUInt8(0);
      const isMultiplexed = (firstByte === 1 || firstByte === 2) &&
                             logBuffer.length >= 8 &&
                             logBuffer.readUInt8(1) === 0 &&
                             logBuffer.readUInt8(2) === 0 &&
                             logBuffer.readUInt8(3) === 0;

      if (isMultiplexed) {
        let offset = 0;
        while (offset + 8 <= logBuffer.length) {
          const streamType = logBuffer.readUInt8(offset);
          const frameLength = logBuffer.readUInt32BE(offset + 4);
          if (frameLength === 0) { offset += 8; continue; }
          if (offset + 8 + frameLength > logBuffer.length) {
            const chunk = logBuffer.slice(offset + 8).toString("utf8");
            if (streamType === 1) stdoutStr += chunk;
            else if (streamType === 2) stderrStr += chunk;
            break;
          }
          const chunk = logBuffer.slice(offset + 8, offset + 8 + frameLength).toString("utf8");
          if (streamType === 1) stdoutStr += chunk;
          else if (streamType === 2) stderrStr += chunk;
          offset += 8 + frameLength;
        }
      } else {
        stdoutStr = logBuffer.toString("utf8");
      }
    }

    stdoutStr = stdoutStr.replace(/\r/g, "").replace(/\0/g, "").trim();
    stderrStr = stderrStr.replace(/\r/g, "").replace(/\0/g, "").trim();

    try { await container.remove(); } catch {}
    try {
      await fs.unlink(path.join(hostTmpDir, filename));
      await fs.unlink(path.join(hostTmpDir, inputFilename));
      if (language === "cpp") await fs.unlink(path.join(hostTmpDir, uniqueId)).catch(() => {});
      if (language === "java") await fs.unlink(path.join(hostTmpDir, `${className}.class`)).catch(() => {});
    } catch {}

    if (stderrStr) {
      const isCompileError =
        (language === "java" || language === "cpp") &&
        stderrStr.includes(filename) &&
        /error:/i.test(stderrStr);

      if (isCompileError) {
        return { status: "Compilation Error", output: stderrStr, runtime };
      }
      return { status: "Runtime Error", output: stderrStr, runtime };
    }

    return { status: "Success", output: stdoutStr, runtime };

  } catch (err) {
    clearTimeout(timeoutId);
    if (container) {
      try { await container.kill(); } catch {}
      try { await container.remove(); } catch {}
    }
    try {
      await fs.unlink(path.join(hostTmpDir, filename)).catch(() => {});
      await fs.unlink(path.join(hostTmpDir, inputFilename)).catch(() => {});
      if (language === "cpp") await fs.unlink(path.join(hostTmpDir, uniqueId)).catch(() => {});
      if (language === "java") await fs.unlink(path.join(hostTmpDir, `${className}.class`)).catch(() => {});
    } catch {}

    if (isTimedOut || err.message === "TLE") {
      return { status: "Time Limit Exceeded", output: "", runtime: timeLimit };
    }
    return { status: "Runtime Error", output: err.message, runtime: 0 };
  }
};

const advanceContestParticipant = async (contestId, participantId, stageIndex, submissionStatus) => {
  if (!contestId || !participantId || typeof stageIndex !== "number") return;

  try {
    const participant = await ContestParticipant.findById(participantId);
    if (!participant || participant.status !== "in_progress") return;

    const stage = participant.stages[stageIndex];
    if (!stage || stage.status !== "in_progress" || submissionStatus !== "Accepted") return;

    stage.status = "solved";
    stage.completedAt = new Date();

    const nextIndex = participant.currentStageIndex + 1;
    if (nextIndex >= participant.stages.length) {
      participant.status = "completed";
      participant.completedAt = new Date();
      participant.totalTimeSeconds = Math.floor((participant.completedAt - participant.joinedAt) / 1000);
    } else {
      participant.currentStageIndex = nextIndex;
      participant.stages[nextIndex].status = "in_progress";
      participant.stages[nextIndex].startedAt = new Date();
    }

    await participant.save();
    redisPublisher.publish("contest_leaderboard_channel", JSON.stringify({ contestId }));
  } catch (contestErr) {
    console.error("Contest progression update failed:", contestErr.message);
  }
};
const runDryRun = async (job) => {
  const { dryRunId, problemId, language, code, inlineProblem } = job.data;

  let problem;
  if (inlineProblem) {
    problem = inlineProblem;
  } else {
    problem = await Problem.findById(problemId);
  }

  if (!problem) {
    redisPublisher.publish("dryrun_channel", JSON.stringify({
      problemId: problemId || "inline", dryRunId, status: "Runtime Error", results: [], message: "Problem not found",
    }));
    return;
  }

  const sampleCases = problem.testCases.filter((tc) => tc.isSample);
  const customDriver = problem.drivers?.[language] || null;
  const results = [];
  let overallStatus = "Completed";

  for (const testCase of sampleCases) {
    const result = await runContainer(language, code, testCase.input, problem.timeLimit || 3000, problem.memoryLimit || 512, customDriver);

    let passed = false;
    let statusLabel = result.status;

    if (result.status === "Success") {
      const normalizedReceived = result.output.replace(/\s+/g, "");
      const normalizedExpected = testCase.expectedOutput.trim().replace(/\s+/g, "");
      passed = normalizedReceived === normalizedExpected;
      statusLabel = passed ? "Passed" : "Wrong Answer";
    }

    if (["Time Limit Exceeded", "Compilation Error", "Runtime Error"].includes(result.status)) {
      overallStatus = result.status;
    }

    results.push({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: result.output,
      passed,
      status: statusLabel,
      runtime: result.runtime,
    });

    if (result.status === "Compilation Error") break;
  }

  redisPublisher.publish("dryrun_channel", JSON.stringify({
    problemId: problemId || "inline",
    dryRunId,
    language,
    status: overallStatus,
    results,
  }));
};
const startWorkerInstance = async () => {
  console.log("Starting JudgeX Automated Sandbox Compilation Engine...");

  try {
    await connectDB();
    await docker.ping();
    console.log("[INFRASTRUCTURE] Mongoose cluster & Docker daemon loops linked successfully.");

    const worker = new Worker("executeCode",async (job) => {
    if (job.data.isDryRun) {
      await runDryRun(job);
      return;
    }

    const { submissionId, problemId, contestId, participantId, stageIndex } = job.data;
    console.log(`\n[QUEUE-EVENT] BullMQ Job popped successfully. Processing ID: ${submissionId}`);

        const submission = await Submission.findById(submissionId);
        if (!submission) return;

        const problem = await Problem.findById(submission.problem);
        if (!problem) {
          submission.status = "Runtime Error";
          await submission.save();
          redisPublisher.publish("submission_channel", JSON.stringify({ problemId, status: "Runtime Error" }));
          return;
        }

        let allPassed = true;
        let runtimeMax = 0;
        let finalVerdict = "Accepted";
        let logsOutput = "";
        let componentsPassed = 0;

        for (let i = 0; i < problem.testCases.length; i++) {
          const testCase = problem.testCases[i];

          const customDriver = problem.drivers?.[submission.language] || null;

          const result = await runContainer(
            submission.language,
            submission.code,
            testCase.input,
            problem.timeLimit,
            problem.memoryLimit,
            customDriver
          );

          if (result.status === "Time Limit Exceeded") {
            allPassed = false;
            finalVerdict = "Time Limit Exceeded";
            logsOutput = `Killed: Process exceeded execution cap of ${problem.timeLimit}ms.`;
            break;
          }

          if (result.status === "Compilation Error") {
            allPassed = false;
            finalVerdict = "Compilation Error";
            logsOutput = result.output;
            break;
          }

          if (result.status === "Runtime Error") {
            allPassed = false;
            finalVerdict = "Runtime Error";
            logsOutput = result.output;
            break;
          }

          const normalizedReceived = result.output.replace(/\s+/g, "");
          const normalizedExpected = testCase.expectedOutput.trim().replace(/\s+/g, "");

          if (normalizedReceived !== normalizedExpected) {
            allPassed = false;
            finalVerdict = "Wrong Answer";
            logsOutput = `Assertion failure.\nReceived: "${result.output}"\nExpected: "${testCase.expectedOutput}"`;
            break;
          }

          componentsPassed++;
          if (result.runtime > runtimeMax) runtimeMax = result.runtime;
        }

        submission.status = finalVerdict;
        submission.executionTime = runtimeMax;
        submission.memoryUsed = problem.memoryLimit;
        submission.errorLog = allPassed ? null : logsOutput;
        submission.passedCount = componentsPassed;
        submission.totalCount = problem.testCases.length;
        await submission.save();

        redisPublisher.publish("submission_channel", JSON.stringify({
          problemId: problemId,
          status: submission.status,
          message: submission.errorLog || "All verification testing assertions evaluated successfully.",
          metrics: {
            runtime: submission.executionTime,
            memory: submission.memoryUsed
          }
        }));

        await advanceContestParticipant(contestId, participantId, stageIndex, submission.status);
      },
      { connection: redisConnection }
    );

    worker.on("completed", (job) => console.log(`[JOB-DONE] Pipeline run complete for ID: ${job.id}`));
    worker.on("failed", (job, err) => console.error(`[JOB-FAIL] Evaluation exception caught on ID: ${job?.id}`, err));

  } catch (initErr) {
    console.error("[SHUTDOWN] Initialization failure:", initErr.message);
    process.exit(1);
  }
};

startWorkerInstance();