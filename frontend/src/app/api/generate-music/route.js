import { exec } from "child_process";
import util from "util";
import { NextResponse } from "next/server";
import path from "path";

const execPromise = util.promisify(exec);

export async function POST(request) {
  try {
    const { query } = await request.json();

    // Sanitize the query to prevent command injection
    const sanitizedQuery = query.replace(/"/g, '\\"');

    console.log("Executing Deno script with query:", sanitizedQuery);

    // Navigate up a directory to reach the parent folder, then into musicgen
    const scriptPath = path.join(
      process.cwd(),
      "..",
      "musicgen",
      "01_getNews",
      "index.js",
    );
    console.log("Script path:", scriptPath);

    // Execute the Deno script with the absolute path
    const { stdout, stderr } = await execPromise(
      `deno run -A "${scriptPath}" --query="${sanitizedQuery}"`,
      {
        env: {
          ...process.env,
          PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
        },
      },
    );

    if (stderr) {
      console.error("Deno script error:", stderr);
      return NextResponse.json({ error: stderr }, { status: 500 });
    }

    console.log("Deno script executed successfully");

    // Return the result
    return NextResponse.json({ result: stdout });
  } catch (error) {
    console.error("Error executing Deno script:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
