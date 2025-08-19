const { Octokit } = require("@octokit/rest");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const octokit = new Octokit({
  auth: process.env.GHUB_TOKEN,
});

async function run() {
  const [,, repoName, tipoProjeto] = process.argv;

  if (!repoName) {
    console.error("❌ Uso: node criar-repos.js <repo_name> <tipo_projeto>");
    process.exit(1);
  }

  try {
    // Cria repositório vazio
    const repo = await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      private: true,
      description: `Repositório automático (${tipoProjeto || "site/lp"}) 🚀`,
      auto_init: false
    });

    console.log("✅ Repositório criado:", repo.data.html_url);

    // Diretório temporário
    const tmpDir = path.join(__dirname, "../temp_repo");
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir);
    process.chdir(tmpDir);

    execSync("git init", { stdio: "inherit" });

    // Configura usuário Git
    execSync("git config user.name 'github-actions[bot]'", { stdio: "inherit" });
    execSync("git config user.email 'github-actions[bot]@users.noreply.github.com'", { stdio: "inherit" });

    // Adiciona remote com token na URL
    const token = process.env.GHUB_TOKEN;
    const owner = repo.data.owner.login;
    const repoUrl = `https://${token}@github.com/${owner}/${repoName}.git`;
    execSync(`git remote add origin ${repoUrl}`, { stdio: "inherit" });

    // Criar apenas branch hmg
    const branch = "hmg";
    const templatePath = path.join(__dirname, "../templates/hmg");

    if (!fs.existsSync(templatePath)) {
      fs.mkdirSync(templatePath, { recursive: true });
    }

    const files = fs.existsSync(templatePath) ? fs.readdirSync(templatePath) : [];
    if (files.length === 0) {
      fs.writeFileSync(path.join(templatePath, "README.md"), `# ${branch.toUpperCase()} - branch inicial (${tipoProjeto || "site/lp"})`);
    }

    execSync(`git checkout -b ${branch}`, { stdio: "inherit" });
    execSync(`cp -r ${templatePath}/. .`, { stdio: "inherit" });
    execSync("git add .", { stdio: "inherit" });
    execSync(`git commit -m "Commit inicial ${branch}"`, { stdio: "inherit" });
    execSync(`git push -u origin ${branch}`, { stdio: "inherit" });

    console.log("✅ Branch hmg criada com README.md inicial!");
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

run();
