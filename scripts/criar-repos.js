const { Octokit } = require("@octokit/rest");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const octokit = new Octokit({
  auth: process.env.GHUB_TOKEN,
});

async function run() {
  const [,, repoName, ambiente] = process.argv;

  if (!repoName || !ambiente) {
    console.error("❌ Uso: node criar-repos.js <repo_name> <hmg|prd>");
    process.exit(1);
  }

  try {
    const repo = await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      private: true,
      description: `Repositório automático (${ambiente}) 🚀`,
    });

    console.log("✅ Repositório criado:", repo.data.html_url);

    const templatePath = path.join(__dirname, `../templates/${ambiente}`);

    if (fs.existsSync(templatePath)) {
      console.log("📂 Copiando arquivos do template:", ambiente);

      execSync("git init", { stdio: "inherit" });
      execSync(`git remote add origin ${repo.data.clone_url}`, { stdio: "inherit" });
      execSync(`cp -r ${templatePath}/. .`, { stdio: "inherit" });

      execSync("git config user.name 'github-actions[bot]'");
      execSync("git config user.email 'github-actions[bot]@users.noreply.github.com'");

      execSync("git add .", { stdio: "inherit" });
      execSync('git commit -m "Commit inicial via automação"', { stdio: "inherit" });
      execSync("git branch -M main", { stdio: "inherit" });
      execSync("git push -u origin main", { stdio: "inherit" });

      console.log("✅ Arquivos enviados para:", repoName);
    } else {
      console.log("⚠️ Nenhum template encontrado para", ambiente);
    }
  } catch (error) {
    console.error("❌ Erro ao criar repositório:", error);
    process.exit(1);
  }
}

run();