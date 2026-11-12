(() => {
  const configured = () => window.SUPABASE_URL && window.SUPABASE_ANON_KEY &&
    !window.SUPABASE_URL.startsWith("ВСТАВЬТЕ") && !window.SUPABASE_ANON_KEY.startsWith("ВСТАВЬТЕ");
  let supabaseClient;

const sb = () => {
  if (!configured() || !window.supabase?.createClient) return null;

  if (!supabaseClient) {
    supabaseClient = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );
  }

  return supabaseClient;
};
  const authPanel = document.getElementById("auth-panel");
  const uploadPanel = document.getElementById("upload-panel");
  const message = document.getElementById("admin-message");
  const say = (text, error=false) => { message.textContent = text; message.className = "status-message" + (error ? " error" : ""); };
  const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function ready() {
  if (!configured()) {
    say("Не настроен Supabase в config.js.", true);
  } else if (!window.supabase || typeof window.supabase.createClient !== "function") {
    say("Не загрузилась библиотека Supabase. Проверьте подключение к интернету или блокировщик рекламы.", true);
  } else {
    refreshSession();
  }
}
  async function refreshSession() {
    const {data:{session}} = await sb().auth.getSession();
    authPanel.hidden = !!session;
    uploadPanel.hidden = !session;
    if (session) loadAdminList();
  }
  document.getElementById("login-form").addEventListener("submit", async e => {
  e.preventDefault();
  say("Выполняется вход…");

  try {
    const f = new FormData(e.currentTarget);

    const result = await Promise.race([
      sb().auth.signInWithPassword({
        email: f.get("email"),
        password: f.get("password")
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Сервер не ответил за 20 секунд. Проверьте интернет.")), 20000)
      )
    ]);

    if (result.error) {
      return say(result.error.message, true);
    }

    e.currentTarget.reset();
    say("Вход выполнен.");
    await refreshSession();

  } catch (error) {
    say("Ошибка входа: " + error.message, true);
  }
});
  document.getElementById("logout-button").addEventListener("click", async () => {
    await sb().auth.signOut(); say("Вы вышли из панели."); refreshSession();
  });
  document.getElementById("upload-form").addEventListener("submit", async e => {
    e.preventDefault();
    const form = e.currentTarget, data = new FormData(form);
    const title = String(data.get("title")).trim(), file = data.get("file");
    if (!file || !file.name.toLowerCase().endsWith(".docx")) return say("Выберите файл формата .docx.", true);
    const id = crypto.randomUUID(), path = `${id}.docx`;
    say("Загрузка документа…");
    const {error:uploadError} = await sb().storage.from("lecture-files").upload(path, file, {contentType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document", upsert:false});
    if (uploadError) return say(uploadError.message, true);
    const {error:insertError} = await sb().from("lectures").insert({id, title, file_path:path, file_name:file.name});
    if (insertError) {
      await sb().storage.from("lecture-files").remove([path]);
      return say(insertError.message, true);
    }
    form.reset(); say("Лекция успешно добавлена."); loadAdminList();
  });
  async function loadAdminList() {
    const area = document.getElementById("admin-lectures");
    const {data,error} = await sb().from("lectures").select("id,title").order("title");
    if (error) { area.textContent = error.message; return; }
    area.innerHTML = data.length ? data.map(x => `<article class="lecture-row"><a class="lecture-name" href="lecture.html?id=${encodeURIComponent(x.id)}">${escapeHtml(x.title)}</a><button class="delete-button" data-id="${x.id}" data-title="${escapeHtml(x.title)}" type="button">Удалить</button></article>`).join("") : '<p class="muted">Пока лекций нет.</p>';
    area.querySelectorAll(".delete-button").forEach(btn => btn.addEventListener("click", () => removeLecture(btn.dataset.id, btn.dataset.title)));
  }
  async function removeLecture(id, title) {
    if (!confirm(`Удалить лекцию «${title}»?`)) return;
    const {data:item,error:readError} = await sb().from("lectures").select("file_path").eq("id",id).single();
    if (readError) return say(readError.message,true);
    const {error:storageError} = await sb().storage.from("lecture-files").remove([item.file_path]);
    if (storageError) return say(storageError.message,true);
    const {error} = await sb().from("lectures").delete().eq("id",id);
    if (error) return say(error.message,true);
    say("Лекция удалена."); loadAdminList();
  }
  ready();
})();
