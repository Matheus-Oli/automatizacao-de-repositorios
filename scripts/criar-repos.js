const { Octokit } = require("@octokit/rest");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const octokit = new Octokit({
  auth: process.env.GHUB_TOKEN,
});

async function run() {
  const [,, repoName] = process.argv;

  if (!repoName) {
    console.error("❌ Uso: node criar-repos.js <repo_name>");
    process.exit(1);
  }

  try {
    // Cria repositório vazio
    const repo = await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      private: true,
      description: `Repositório automático 🚀`,
      auto_init: false // sem main
    });

    console.log("✅ Repositório criado:", repo.data.html_url);

    const tmpDir = path.join(__dirname, "../temp_repo");
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir);
    process.chdir(tmpDir);

    execSync("git init", { stdio: "inherit" });
    execSync(`git remote add origin ${repo.data.clone_url}`, { stdio: "inherit" });

    // Função para criar branch a partir do template
    function criarBranch(branch, templateFolder) {
      const templatePath = path.join(__dirname, `../templates/${templateFolder}`);
      if (!fs.existsSync(templatePath)) {
        console.log(`⚠️ Template ${templateFolder} não encontrado.`);
        return;
      }

      execSync(`git checkout -b ${branch}`, { stdio: "inherit" });
      execSync(`cp -r ${templatePath}/. .`, { stdio: "inherit" });
      execSync("git add .", { stdio: "inherit" });
      execSync(`git commit -m "Commit inicial ${branch}"`, { stdio: "inherit" });
      execSync(`git push -u origin ${branch}`, { stdio: "inherit" });
    }

    criarBranch("hmg", "hmg");
    criarBranch("prd", "prd");

    console.log("✅ Branches hmg e prd criadas no repositório sem main!");
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

run();