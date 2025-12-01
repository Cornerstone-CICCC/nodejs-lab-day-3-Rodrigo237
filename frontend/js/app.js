const socket = io(`http://localhost:3700`);

const chatForm = document.getElementById("chatForm");
const usernameInput = document.getElementById("usernameInput");
const messageInput = document.getElementById("messageInput");
const messagesList = document.getElementById("messagesList");
const roomButtons = document.querySelectorAll(".room-btn");
const leaveRoomBtn = document.getElementById("leaveRoomBtn");
const currentRoomName = document.getElementById("currentRoomName");

let currentRoom = null;

leaveRoomBtn.disabled = true;

roomButtons.forEach(btn =>
  btn.addEventListener("click", () => joinRoom(btn.dataset.room))
);

leaveRoomBtn.addEventListener("click", () => currentRoom && leaveRoom(currentRoom));

chatForm.addEventListener("submit", e => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const message = messageInput.value.trim();

  if (!username || !message || !currentRoom) {
    alert("Enter username, message and join a room first!");
    return;
  }

  socket.emit("sendMessage", { username, message, room: currentRoom });
  messageInput.value = "";
  messageInput.focus();
});

function joinRoom(room) {
  const username = usernameInput.value.trim();
  if (!username) return alert("Please enter your username first!");

  if (currentRoom) socket.emit("leaveRoom", { room: currentRoom, username });

  currentRoom = room;
  socket.emit("joinRoom", { room, username });

  updateRoomUI(room);
  messagesList.innerHTML = "";
  fetchMessagesByRoom(room);
}

function leaveRoom(room) {
  const username = usernameInput.value.trim();
  if (username) socket.emit("leaveRoom", { room, username });

  currentRoom = null;
  messagesList.innerHTML = "";
  updateRoomUI(null);
}

function updateRoomUI(room) {
  roomButtons.forEach(btn =>
    btn.classList.toggle("active", btn.dataset.room === room)
  );
  currentRoomName.textContent = room ? capitalize(room) : "None";
  leaveRoomBtn.disabled = !room;
}

async function fetchMessagesByRoom(room) {
  try {
    const res = await fetch(`http://localhost:3700/api/chat/room/${room}`);
    if (!res.ok) throw new Error(res.statusText);
    const messages = await res.json();
    (messages || []).reverse().forEach(displayMessage);
  } catch (err) {
    console.error("Error fetching messages:", err);
  }
}

function displayMessage({ username, message, createdAt, timestamp }) {
  const li = document.createElement("li");
  li.innerHTML = `
    <span class="message-username">${username}:</span>
    <span class="message-text">${message}</span>
    <span class="message-time">${new Date(createdAt || timestamp || Date.now()).toLocaleTimeString()}</span>
  `;
  messagesList.appendChild(li);
}

function displaySystemMessage(text) {
  const li = document.createElement("li");
  li.className = "system-message";
  li.textContent = text;
  messagesList.appendChild(li);
}

const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

socket.on("newMessage", displayMessage);
socket.on("systemMessage", data => displaySystemMessage(data.message));
socket.on("connect", () => console.log("✅ Connected to server"));
socket.on("disconnect", () => {
  console.log("❌ Disconnected from server");
  displaySystemMessage("Disconnected from server");
});
