const crypto = require("crypto");
const Redis = require("ioredis");
const { askAI, askAIWithFallback } = require("../utils/aiClient");
const submissionQueue = require("../queue/submission.queue");

const SYSTEM_PROMPT = `You are a coding problem generator for JudgeX, a multi-language online judge platform.

Given a rough topic/idea from the admin, generate a complete coding problem as strict JSON with this exact shape:

{
  "title": "string",
  "description": "markdown string with problem statement, 2-3 examples with Input/Output/Explanation, and a Constraints section",
  "difficulty": "Easy" | "Medium" | "Hard",
  "tags": ["string", "string"],
  "boilerplates": {
    "javascript": "function solution(...) { ... }",
    "python": "def solution(...): ...",
    "cpp": "class Solution {\\npublic:\\n    ReturnType solution(ParamTypes) { ... }\\n};",
    "java": "class Solution {\\n    public ReturnType solution(ParamTypes) { ... }\\n}"
  },
  "testCases": [
    { "input": "raw stdin-style input matching the driver format", "expectedOutput": "expected output string", "isSample": true }
  ]
}

Rules:
- Boilerplates must be an unimplemented function/class stub only — no solution logic, just a "// Write your code here" comment and a placeholder return.
- Provide at least 5 test cases, at least 2 marked isSample: true.
- testCases[].input must be plain text lines matching how each language's parser reads stdin (one value per line, JSON-array style for arrays e.g. [1,2,3]).
- All 4 languages MUST share the exact same parameters, order, and return type concept.
- If the problem involves a singly linked list, define a ListNode helper INSIDE each boilerplate (above the Solution/function), identical in concept across languages:
  javascript: function ListNode(val, next) { this.val = (val===undefined?0:val); this.next = (next===undefined?null:next); }
  python: class ListNode:\\n    def __init__(self, val=0, next=None):\\n        self.val = val\\n        self.next = next
  cpp: struct ListNode { int val; ListNode *next; ListNode(int x) : val(x), next(nullptr) {} };
  java (separate non-public class above Solution): class ListNode { int val; ListNode next; ListNode(int x) { val = x; } }
  testCases input for a list is a plain JSON array of its values, e.g. [1,2,3,4,5].
- If it involves a binary tree, define a TreeNode helper (val/left/right) the same way; represent input as level-order array using "null" for missing nodes.
- Output ONLY the JSON object. No markdown fences, no commentary.`;

const DRIVER_RULES_BY_LANG = {
  javascript: `Write ONE JavaScript driver file. Output ONLY the raw code — no JSON, no markdown fences, no explanation, no commentary. Just the code itself, nothing else.
- Read input via: const raw = require('fs').readFileSync('/app/input_template.txt', 'utf8'); — this literal filename string must appear exactly as written.
- Split into trimmed non-empty lines, JSON.parse() each line for its typed value.
- The boilerplate given to you is ALREADY DEFINED above this driver in the same file. Do NOT redeclare, redefine, or copy it. Call it directly using its exact existing name.
- console.log(JSON.stringify(result)) to print the final answer.
- Wrap everything in a main() function and call main() at the end.`,

  python: `Write ONE Python driver file. Output ONLY the raw code — no JSON, no markdown fences, no explanation, no commentary. Just the code itself, nothing else.
- Read input via: with open('/app/input_template.txt', 'r') as f: raw = f.read() — this literal filename string must appear exactly as written.
- Split into stripped non-empty lines, json.loads() each line.
- The boilerplate given to you is ALREADY DEFINED above this driver in the same file. Do NOT redeclare, redefine, or copy it.
- CRITICAL: Look at the exact boilerplate code you were given below. If it defines a bare function like "def solution(...):", call it directly as solution(...) — do NOT wrap it in a class or write "Solution()". If it defines "class Solution:" with a method inside, then instantiate as "sol = Solution()" and call "sol.<method_name>(...)" using the exact method name from the boilerplate. Match whichever shape the boilerplate actually uses.
- print(json.dumps(result)) to print the final answer.
- Wrap in a main() function guarded by if __name__ == "__main__":`,

  cpp: `Write ONE C++ driver file. Output ONLY the raw code — no JSON, no markdown fences, no explanation, no commentary. Just the code itself, nothing else.
- Do NOT include #include <bits/stdc++.h> or using namespace std; — the platform already prepends these. Only write what comes after.
- Read input via getline(cin, ...) — NOT from a file, stdin is piped via shell redirection.
- Manually parse array-formatted input lines (strip '[', ']', spaces, split on ',', stoi/stod each token) — no JSON library is available.
- CRITICAL: The boilerplate given to you already defines "class Solution { ... };" ABOVE this driver in the same compiled file. Do NOT write "class Solution" again in your driver — that causes a compile error (redefinition). Only write "Solution solver;" to instantiate the EXISTING class, then call "solver.<method_name>(...)" using the exact method name from the boilerplate.
- Print result matching the exact expectedOutput format.
- Must have a full "int main() { ... return 0; }".
- Keep the code compact and direct — avoid unnecessary helper functions.`,

  java: `Write ONE Java driver file. Output ONLY the raw code — no JSON, no markdown fences, no explanation, no commentary. Just the code itself, nothing else.
- Do NOT use import statements — write fully-qualified class names inline (e.g. java.io.BufferedReader), since this driver is concatenated AFTER the boilerplate and Java requires imports at the top of the file.
- The driver's public class MUST be named exactly "Main": public class Main { public static void main(String[] args) throws Exception { ... } }
- Read input via BufferedReader/InputStreamReader on System.in — NOT from a file.
- CRITICAL: The boilerplate given to you already defines "class Solution { ... }" ABOVE this driver in the same file. Do NOT redeclare it. Only write "Solution solver = new Solution();" to instantiate the EXISTING class, then call "solver.<method_name>(...)" using the exact method name from the boilerplate.
- Manually parse array-formatted input lines the same way as C++ (strip brackets, split on comma, Integer.parseInt each token).
- Print result matching the exact expectedOutput format.
- Keep the code compact and direct — avoid unnecessary helper methods.`,
};

const stripCodeFences = (text) => {
  return text
    .trim()
    .replace(/^```[a-zA-Z]*\n?/, "")
    .replace(/```$/, "")
    .trim();
};

const generateProblem = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: "A topic or idea prompt is required" });
    }

    const raw = await askAI({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: `Generate a problem based on this idea: ${prompt}`,
      jsonMode: true,
      temperature: 0.5,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    });

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      console.error("generateProblem JSON parse failed:", parseErr.message, "\nRaw:", raw);
      return res.status(502).json({ message: "AI returned malformed output. Please try again." });
    }

    if (!parsed.title || !parsed.description || !Array.isArray(parsed.testCases)) {
      console.error("generateProblem incomplete:", parsed);
      return res.status(502).json({ message: "AI output was incomplete. Please try again." });
    }

    return res.status(200).json({ problem: parsed });
  } catch (error) {
    console.error("generateProblem fatal error:", error);
    return res.status(500).json({ message: `Error generating problem: ${error.message}` });
  }
};

const generateDrivers = async (req, res) => {
  try {
    const { boilerplates, sampleTestCase } = req.body;

    if (!boilerplates || !sampleTestCase?.input || !sampleTestCase?.expectedOutput) {
      return res.status(400).json({ message: "Boilerplates and at least one sample test case are required" });
    }

    const primaryModel = process.env.GROQ_DRIVER_MODEL || "openai/gpt-oss-120b";
    const fallbackModel = process.env.GROQ_DRIVER_FALLBACK_MODEL || "llama-3.3-70b-versatile";
    const languages = ["javascript", "python", "cpp", "java"];

    const drivers = {};
    const failures = [];

    for (const lang of languages) {
      const langRules = DRIVER_RULES_BY_LANG[lang];
      const userPrompt = `Function signature (boilerplate) for this language:
${boilerplates[lang] || "(not provided)"}

Sample input this driver must correctly parse:
${sampleTestCase.input}

Sample expected output:
${sampleTestCase.expectedOutput}

Write the driver now. Remember: output ONLY the raw code, nothing else.`;

      try {
        const { raw } = await askAIWithFallback({
          systemPrompt: langRules,
          userPrompt,
          jsonMode: false,
          temperature: 0.1,
          primaryModel,
          fallbackModel,
          maxTokens: 2000,
        });

        const cleaned = stripCodeFences(raw);
        if (!cleaned) {
          failures.push(lang);
          continue;
        }

        drivers[lang] = cleaned;
      } catch (err) {
        console.error(`generateDrivers failed for ${lang} after all retries:`, err.message);
        failures.push(lang);
      }
    }

    if (Object.keys(drivers).length === 0) {
      return res.status(502).json({ message: "AI failed to generate any drivers. Please try again or write drivers manually." });
    }

    return res.status(200).json({ drivers, failures });
  } catch (error) {
    console.error("generateDrivers fatal error:", error);
    return res.status(500).json({ message: `Error generating drivers: ${error.message}` });
  }
};

const waitForDryRunResult = (dryRunId, timeoutMs = 30000) => {
  return new Promise((resolve) => {
    const subscriber = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");
    let settled = false;

    const cleanup = () => {
      if (!settled) {
        settled = true;
        subscriber.disconnect();
      }
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve({ status: "Timeout", results: [] });
    }, timeoutMs);

    subscriber.subscribe("dryrun_channel", (err) => {
      if (err) {
        clearTimeout(timer);
        cleanup();
        resolve({ status: "Runtime Error", results: [] });
      }
    });

    subscriber.on("message", (channel, message) => {
      if (channel !== "dryrun_channel") return;
      try {
        const payload = JSON.parse(message);
        if (payload.dryRunId === dryRunId) {
          clearTimeout(timer);
          cleanup();
          resolve(payload);
        }
      } catch {
        // ignore malformed
      }
    });
  });
};

const validateGeneratedProblem = async (req, res) => {
  try {
    const { boilerplates, drivers, testCases, timeLimit, memoryLimit } = req.body;

    if (!boilerplates || !drivers || !Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({ message: "boilerplates, drivers, and testCases are required" });
    }

    const inlineProblem = {
      testCases,
      timeLimit: timeLimit || 3000,
      memoryLimit: memoryLimit || 512,
    };

    const languagesToValidate = Object.keys(drivers).filter((lang) => drivers[lang]?.trim());
    const report = {};

    for (const lang of languagesToValidate) {
      const dryRunId = crypto.randomUUID();
      const problemForLang = { ...inlineProblem, drivers: { [lang]: drivers[lang] } };

      await submissionQueue.add("processDryRun", {
        dryRunId,
        language: lang,
        code: boilerplates[lang],
        isDryRun: true,
        inlineProblem: problemForLang,
      }, { removeOnComplete: true, removeOnFail: true });

      const result = await waitForDryRunResult(dryRunId, 30000);
      const allPassed = result.results?.length > 0 && result.results.every((r) => r.passed);

      report[lang] = {
        passed: allPassed,
        status: result.status,
        results: result.results || [],
      };
    }

    const allLanguagesPassed = languagesToValidate.length > 0 && languagesToValidate.every((l) => report[l].passed);

    return res.status(200).json({ allLanguagesPassed, report });
  } catch (error) {
    console.error("validateGeneratedProblem fatal error:", error);
    return res.status(500).json({ message: `Error validating generated problem: ${error.message}` });
  }
};

module.exports = { generateProblem, generateDrivers, validateGeneratedProblem };