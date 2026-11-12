(() => {
  const page = document.body.dataset.page;
  const configured = () => window.SUPABASE_URL && window.SUPABASE_ANON_KEY &&
    !window.SUPABASE_URL.startsWith("ВСТАВЬТЕ") && !window.SUPABASE_ANON_KEY.startsWith("ВСТАВЬТЕ");
  const client = () => configured() ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;
  const results = document.getElementById("lecture-results");

  function setupMessage(el, msg) {
    if (el) el.innerHTML = `<p class="muted">${msg}</p>`;
  }
  function safe(text) {
    return String(text ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function card(item) {
    return `<article class="lecture-row"><a class="lecture-name" href="lecture.html?id=${encodeURIComponent(item.id)}">${safe(item.title)}</a><a class="row-arrow" aria-label="Открыть лекцию" href="lecture.html?id=${encodeURIComponent(item.id)}">→</a></article>`;
  }
  async function getLectures() {
    const sb = client();
    if (!sb) throw new Error("Сайт ещё не подключён к хранилищу. Сначала заполните config.js по инструкции README.");
    const { data, error } = await sb.from("lectures").select("id,title,created_at").order("title", {ascending:true});
    if (error) throw error;
    return data || [];
  }
  async function showList(filter = null) {
    try {
      const all = await getLectures();
      const filtered = filter === null ? all : all.filter(x => x.title.toLocaleLowerCase("ru").includes(filter.toLocaleLowerCase("ru")));
      if (!filtered.length) return setupMessage(results, filter ? "По вашему запросу ничего не найдено." : "Пока лекций нет.");
      results.innerHTML = filtered.map(card).join("");
    } catch (e) { setupMessage(results, safe(e.message)); }
  }

  if (page === "lectures") showList();
  if (page === "search") {
    const input = document.getElementById("search-input");
    let timer;
    input.addEventListener("input", () => {
      clearTimeout(timer);
      const value = input.value.trim();
      if (!value) return setupMessage(results, "Введите название для поиска.");
      timer = setTimeout(() => showList(value), 180);
    });
  }
  if (page === "lecture") loadDetail();

  async function loadDetail() {
    const target = document.getElementById("lecture-detail");
    try {
      const id = new URLSearchParams(location.search).get("id");
      if (!id) throw new Error("Не указана лекция.");
      const sb = client();
      if (!sb) throw new Error("Сайт ещё не подключён к хранилищу. Сначала заполните config.js по инструкции README.");
      const {data: item, error} = await sb.from("lectures").select("*").eq("id", id).single();
      if (error) throw error;
      const {data: blob, error: downloadError} = await sb.storage.from("lecture-files").download(item.file_path);
      if (downloadError) throw downloadError;
      const url = URL.createObjectURL(blob);
      target.innerHTML = `<div class="detail-heading"><div><p class="eyebrow">ЛЕКЦИЯ</p><h1>${safe(item.title)}</h1></div><a class="solid-button download-button" href="${url}" download="${safe(item.file_name)}">Скачать .docx</a></div><section class="document-preview"><h2>Предварительный просмотр</h2><div id="docx-preview" class="docx-content">Подготовка просмотра…</div></section>`;
      const arrayBuffer = await blob.arrayBuffer();
      const rendered = await window.mammoth.convertToHtml({arrayBuffer});
      document.getElementById("docx-preview").innerHTML = rendered.value || "<p>В документе нет текста для предварительного просмотра.</p>";
    } catch(e) { target.innerHTML = `<p class="muted">${safe(e.message)}</p>`; }
  }
})();
