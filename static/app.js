const KEYS = ["who", "when", "where", "what", "how", "why"];

const AI_STATUS_TEXT = {
  400: "잘못된 요청",
  401: "인증 실패 (API 키 확인)",
  429: "요청 한도 초과",
  500: "AI 서버 내부 오류",
  529: "서버 과부하",
};

const input = document.getElementById("input");
const count = document.getElementById("count");
const button = document.getElementById("submit-btn");
const statusText = document.getElementById("status");
const historyList = document.getElementById("history-list");
const originalBox = document.getElementById("original-box");
const original = document.getElementById("original");

let busy = false;

function setStatus(message, isError) {
  statusText.textContent = message;
  statusText.className = isError ? "error" : "";
}

function showDetail(data) {
  originalBox.hidden = false;
  original.textContent = data.original_text;
  for (const key of KEYS) {
    document.getElementById("r-" + key).textContent = data.result ? data.result[key] : "-";
  }
}

function errorMessage(status, data) {
  if (status === 502) {
    const code = data && data.ai_status;
    if (code) {
      const meaning = AI_STATUS_TEXT[code] || "알 수 없는 오류";
      return "AI 응답 실패 (오류 코드 " + code + ": " + meaning + ")";
    }
    return "AI 응답 실패 (" + ((data && data.error) || "알 수 없는 오류") + ")";
  }
  if (status === 422) {
    return "입력 오류: 내용을 입력해 주세요. (공백 제외, 1000자 이하)";
  }
  return "요청 실패 (HTTP " + status + ")";
}

async function submitSummary() {
  if (busy) return;
  busy = true;
  button.disabled = true;
  input.disabled = true;
  setStatus("요약 중…", false);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 70000);

  try {
    const response = await fetch("/api/summaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input.value }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setStatus(errorMessage(response.status, data), true);
      return;
    }
    showDetail(data);
    setStatus("요약 완료", false);
    loadHistory();
  } catch (error) {
    if (error.name === "AbortError") {
      setStatus("시간 초과", true);
    } else {
      setStatus("서버 연결 실패", true);
    }
  } finally {
    clearTimeout(timer);
    busy = false;
    button.disabled = false;
    input.disabled = false;
  }
}

async function loadHistory() {
  try {
    const response = await fetch("/api/summaries");
    if (!response.ok) return;
    const items = await response.json();

    historyList.replaceChildren();
    for (const item of items) {
      const li = document.createElement("li");
      const title = document.createElement("span");
      title.textContent = item.preview;
      const meta = document.createElement("span");
      meta.className = "meta";
      meta.textContent = item.created_at.replace("T", " ").slice(0, 19) + " · " + item.status;
      li.append(title, meta);
      li.addEventListener("click", () => openHistory(item.id));
      historyList.append(li);
    }
  } catch (error) {
    setStatus("서버 연결 실패", true);
  }
}

async function openHistory(id) {
  try {
    const response = await fetch("/api/summaries/" + id);
    if (!response.ok) {
      setStatus("기록을 불러오지 못했습니다.", true);
      return;
    }
    const data = await response.json();
    showDetail(data);
    if (data.status === "failed") {
      setStatus("이 기록은 요약에 실패했습니다.", true);
    } else if (data.status === "pending") {
      setStatus("이 기록은 아직 처리 중입니다.", false);
    } else {
      setStatus("", false);
    }
  } catch (error) {
    setStatus("서버 연결 실패", true);
  }
}

input.addEventListener("input", () => {
  count.textContent = input.value.length + " / 1000";
});

input.addEventListener("keydown", (event) => {
  // 한글 조합 중 Enter는 무시해서 중복 제출을 막는다.
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    submitSummary();
  }
});

button.addEventListener("click", submitSummary);

loadHistory();
