const { Octokit } = require("@octokit/rest");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const octokit = new Octokit({
  auth: process.env.GHUB_TOKEN, // seu secret do GitHub
});

async function run() {
  const [,, repoName, tipoProjeto] = process.argv;

  if (!repoName) {
    console.error("❌ Uso: node criar-repos.js <repo_name>");
    process.exit(1);
  }

  try {
    // Cria repositório vazio sem main
    const repo = await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      private: true,
      description: `Repositório automático (${tipoProjeto || "site/lp"}) 🚀`,
      auto_init: false
    });

    console.log("✅ Repositório criado:", repo.data.html_url);

    // Cria diretório temporário
    const tmpDir = path.join(__dirname, "../temp_repo");
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir);
    process.chdir(tmpDir);

    execSync("git init", { stdio: "inherit" });

    // Configura usuário Git
    execSync("git config user.name 'github-actions[bot]'", { stdio: "inherit" });
    execSync("git config user.email 'github-actions[bot]@users.noreply.github.com'", { stdio: "inherit" });

    execSync(`git remote add origin ${repo.data.clone_url}`, { stdio: "inherit" });

    // Função para criar branch a partir do template
    function criarBranch(branch, templateFolder) {
      const templatePath = path.join(__dirname, `../templates/${templateFolder}`);

      // Se não existir template, cria pasta
      if (!fs.existsSync(templatePath)) {
        fs.mkdirSync(templatePath, { recursive: true });
      }

      // Se template estiver vazio, cria README.md
      const files = fs.existsSync(templatePath) ? fs.readdirSync(templatePath) : [];
      if (files.length === 0) {
        fs.writeFileSync(path.join(templatePath, "README.md"), `# ${branch.toUpperCase()} - branch inicial (${tipoProjeto || "site/lp"})`);
      }

      // Copia arquivos do template
      execSync(`git checkout -b ${branch}`, { stdio: "inherit" });
      execSync(`cp -r ${templatePath}/. .`, { stdio: "inherit" });
      execSync("git add .", { stdio: "inherit" });
      execSync(`git commit -m "Commit inicial ${branch}"`, { stdio: "inherit" });
      execSync(`git push -u origin ${branch}`, { stdio: "inherit" });
    }

    // Cria branches hmg e prd
    criarBranch("hmg", "hmg");
    criarBranch("prd", "prd");

    console.log("✅ Branches hmg e prd criadas com README.md inicial!");
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

run();
