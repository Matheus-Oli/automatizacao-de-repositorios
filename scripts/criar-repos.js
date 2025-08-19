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
    console.log("⚠️ Repositório está vazio. Adicione arquivos manualmente ou depois via script se quiser.");
    
  } catch (error) {
    console.error("❌ Erro ao criar repositório:", error);
    process.exit(1);
  }
}

run();
