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

    function criarBranch(branch, templateFolder) {
      const templatePath = path.join(__dirname, `../templates/${templateFolder}`);

      // Se não existir template, cria pasta temporária
      if (!fs.existsSync(templatePath)) {
        fs.mkdirSync(templatePath, { recursive: true });
      }

      // Se estiver vazia, cria um README.md para forçar a branch
      const files = fs.readdirSync(templatePath);
      if (files.length === 0) {
        fs.writeFileSync(path.join(templatePath, "README.md"), `# ${branch.toUpperCase()} - branch inicial`);
      }

      // Copia arquivos do template
      execSync(`git checkout -b ${branch}`, { stdio: "inherit" });
      execSync(`cp -r ${templatePath}/. .`, { stdio: "inherit" });
      execSync("git add .", { stdio: "inherit" });
      execSync(`git commit -m "Commit inicial ${branch}"`, { stdio: "inherit" });
      execSync(`git push -u origin ${branch}`, { stdio: "inherit" });
    }

    criarBranch("hmg", "hmg");
    criarBranch("prd", "prd");

    console.log("✅ Branches hmg e prd criadas com README.md inicial!");
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

run();