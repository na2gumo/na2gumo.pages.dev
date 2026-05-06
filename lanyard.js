const API_ENDPOINT = "https://discord.com/api/v10";
const ACTIVITY_TYPE = [
  "Playing",
  "Streaming to",
  "Listening to",
  "Watching",
  "Custom status",
  "Competing in",
];

/** @type {number | undefined} */
let rpcStart;
/** @type {number | undefined} */
let rpcEnd;
/** @type {string | undefined} */
let currMusic;

const lanyard = () => {
  const subscribeData = {
    op: 2,
    d: { subscribe_to_id: "1397732710600151110" },
  };
  const ws = new WebSocket("wss://api.lanyard.rest/socket");
  ws.addEventListener("open", () => ws.send(JSON.stringify(subscribeData)));
  ws.addEventListener("error", () => ws.close());
  ws.addEventListener("close", () => setTimeout(lanyard, 1000));
  ws.addEventListener("message", async ({ data }) => {
    const { t, d } = JSON.parse(data);
    if (t !== "INIT_STATE" && t !== "PRESENCE_UPDATE") return;
    console.log(d);
    updateAll(d);
  });
};

const preFetch = (url) =>
  new Promise((_) => {
    const img = new Image();
    img.onload = _();
    img.src = url;
  });

const updateAll = ({ discord_user, discord_status, activities }) => {
  updateAvatar(discord_user);
  updateStatus(discord_status);
  updateActivity(activities);
};

const getDeco = async (sku) => {
  const res = await fetch(`${API_ENDPOINT}/collectibles-products/${sku}`);
  if (res.ok) {
    const data = (await res.json()).items[0].assets;
    return data.animated_image_url ?? data.static_image_url;
  } else return null;
};

const updateAvatar = async (discord_user) => {
  const d = discord_user;
  const avatarUrl = `https://cdn.discordapp.com/avatars/${d.id}/${d.avatar}.webp?size=128`;
  const preLoadAvatar = preFetch(avatarUrl);
  const decoUrl = await getDeco(discord_user.avatar_decoration_data.sku_id);
  if (decoUrl) {
    const ld = document.getElementById("dcollectible");
    ld.src = decoUrl;
  }
  await preLoadAvatar;
  const l = document.getElementById("davatar");
  l.src = avatarUrl;
  /** @type {HTMLDivElement} */
  const parent = document.getElementsByClassName("discord-avatar")[0];
  parent.classList.remove("hide");
  const dummy = document.getElementById("avatar-dummy");
  dummy && dummy.remove();
};

const updateStatus = (status) => {
  const colors = { online: "#4b8", idle: "#fa1", dnd: "#f44", offline: "#778" };
  const l = document.getElementById("ds-label");
  l.classList.remove("pulse");
  l.textContent = status;
  l.style.color = colors[status];
};

/** @param {any[]} activities */
const updateActivity = (activities) => {
  const a = activities.filter((i) => i.type !== 4)[0]; // Ignore Custom Status and pick up first item
  const activityCT = document.getElementsByClassName("discord-activity")[0];
  const typeEl = document.getElementById("da-type");
  const nameEl = document.getElementById("da-name");
  typeEl.textContent = ACTIVITY_TYPE[a.type];
  nameEl.textContent = a.name;
  if (a && activityCT.classList.contains("hide")) {
    activityCT.classList.remove("hide");
  }

  /** @type {HTMLDivElement} */
  const lCT = document.getElementsByClassName("listening-ct")[0];
  const album = document.getElementById("music-album");
  const mTitle = document.getElementById("music-title");
  const mArtist = document.getElementById("music-artist");
  if (a.type == 2 && a.assets.large_image) {
    const url = getRpcIcon(a);
    console.log(url);
    if (url) {
      album.style.backgroundImage = `url(${url})`;
      mTitle.textContent = a.details;
      mArtist.textContent = a.state;
      lCT.classList.remove("hide");
    } else {
      lCT.classList.add("hide");
    }
  } else lCT.classList.add("hide");
  if (!a) {
    typeEl.classList.add("hide");
    return;
  }
  if (currMusic !== a.details) {
    currMusic = a.details;
    rpcStart = a.timestamps.start;
    rpcEnd = a.timestamps.end;
    updateTimeStamp(rpcStart, rpcEnd);
  }
};

const getRpcIcon = (a) => {
  const size = 64;
  /** @type {string} */
  const key = a.assets.large_image;
  if (key.startsWith("mp:")) {
    return `https://media.discordapp.net/${key.slice(3)}?width=${size}&height=${size}`;
  }
  if (key.startsWith("spotify:")) {
    return `https://i.scdn.co/image/${key.slice(8)}`;
  }
  if (a.application_id) {
    return `https://cdn.discordapp.com/app-assets/${a.application_id}/${key}.png?size=${size}`;
  }
  return null;
};

/**
 *
 * @param {string | undefined} startStr
 * @param {string | undefined} endStr
 */
const updateTimeStamp = (startStr, endStr) => {
  if (startStr && endStr) {
    const [start, end] = [startStr, endStr].map((t) => Number(t));
    const now = Date.now();
    const total = end - start;
    const current = now < end ? now - start : total;
    const progress = (current / total) * 100;
    const currentHour = Math.floor(current / 1000 / 60 / 60);
    const currentMinute = Math.floor(current / 1000 / 60) % 60;
    const currentSecond = Math.floor(current / 1000) % 60;
    const totalHour = Math.floor(total / 1000 / 60 / 60);
    const totalMinute = Math.floor(total / 1000 / 60) % 60;
    const totalSecond = Math.floor(total / 1000) % 60;
    const currTimeStr = `${currentHour ? `${padZero(currentHour)}:` : ""}${padZero(currentMinute)}:${padZero(currentSecond)}`;
    const totalTimeStr = `${totalHour ? `${padZero(totalHour)}:` : ""}${padZero(totalMinute)}:${padZero(totalSecond)}`;
    document.getElementById("music-time").textContent =
      `${currTimeStr}/${totalTimeStr}`;
    document.getElementById("da-time").textContent = "";
  } else {
    const timestamp = Number(startStr ?? endStr);
    const diff = Math.abs(timestamp - Date.now());
    const hour = Math.floor(diff / 1000 / 60 / 60);
    const min = Math.floor(diff / 1000 / 60) % 60;
    const sec = Math.floor(diff / 1000) % 60;
    const timeStr = `${hour ? `${padZero(hour)}:` : ""}${padZero(min)}:${padZero(sec)}`;
    const shuffix = timestamp > Date.now() ? "left" : "elapsed";
    document.getElementById("da-time").textContent = `${timeStr} ${shuffix}`;
  }
  setTimeout(
    () => updateTimeStamp(rpcStart, rpcEnd),
    1000 - (Date.now() % 1000),
  );
};

/** @param {number} n */
const padZero = (n) => n.toString().padStart(2, "0");

lanyard();
