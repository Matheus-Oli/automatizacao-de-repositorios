const { Octokit } = require("@octokit/rest");

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
    // 1. Cria repositório vazio
    const repo = await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      private: true,
      description: `Repositório automático (${tipoProjeto || "site/lp"}) 🚀`,
      auto_init: false
    });

    console.log("✅ Repositório criado:", repo.data.html_url);

    const owner = repo.data.owner.login;

    // 2. Adiciona README.md para gerar commit inicial
    try {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo: repoName,
        path: "README.md",
        message: "chore: initial commit",
        content: Buffer.from(`# ${repoName}\n\nRepositório automático 🚀`).toString("base64"),
      });

      console.log("📄 Commit inicial criado com README.md");
    } catch (err) {
      if (err.status === 422) {
        console.warn("⚠️ O README.md já existe. Pulando criação do commit inicial.");
      } else {
        throw err;
      }
    }

    // 3. Pega a referência da branch main
    let mainRef;
    try {
      mainRef = await octokit.rest.git.getRef({
        owner,
        repo: repoName,
        ref: "heads/main"
      });
      console.log("🔍 Branch 'main' encontrada.");
    } catch (err) {
      console.error("❌ Não foi possível encontrar a branch 'main'. Verifique se o commit inicial foi criado corretamente.");
      throw err;
    }

    // 4. Cria branch "prd" a partir da main
    try {
      await octokit.rest.git.createRef({
        owner,
        repo: repoName,
        ref: "refs/heads/prd",
        sha: mainRef.data.object.sha
      });
      console.log("🌿 Branch 'prd' criada com sucesso!");
    } catch (err) {
      if (err.status === 422) {
        console.warn("⚠️ A branch 'prd' já existe. Pulando criação.");
      } else {
        throw err;
      }
    }

  } catch (error) {
    console.error("❌ Erro ao criar repositório ou branches:", error.message || error);
    process.exit(1);
  }
}

run();
