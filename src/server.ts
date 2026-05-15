
// import express, { Request, Response } from "express";
// import multer from "multer";
// import path from "path";
// import mongoose from "mongoose";
// import { createServer } from "http";
// import { Server } from "socket.io";

// const app = express();
// const port = 3000;

// // ── HTTP + Socket.io bootstrap ────────────────────────────────────────────────
// const httpServer = createServer(app);
// const io = new Server(httpServer);

// // ── Static / Middleware ───────────────────────────────────────────────────────
// app.use("/uploads", express.static("uploads"));
// app.use(express.static(path.join(__dirname, "../")));
// app.use(express.json());

// // ── MongoDB ───────────────────────────────────────────────────────────────────
// mongoose
//   .connect("mongodb://localhost:27017/wiser")
//   .then(() => console.log("Connected: mongodb://localhost:27017/wiser"))
//   .catch((err) => console.log(err));

// // ── Schemas & Models ──────────────────────────────────────────────────────────
// const postSchema = new mongoose.Schema({
//   userId: String,
//   caption: String,
//   imageUrl: String,
//   likes: { type: Number, default: 0 },
//   likedUsers: [String],
//   comments: [
//     {
//       text: String,
//       userId: String,
//     },
//   ],
// });

// const userSchema = new mongoose.Schema({
//   username: String,
//   password: String,
// });

// const messageSchema = new mongoose.Schema({
//   senderId: String,
//   receiverId: String,
//   text: String,
//   createdAt: { type: Date, default: Date.now },
// });

// // Global chat message schema
// const chatMessageSchema = new mongoose.Schema({
//   userId:       { type: String, required: true },
//   text:         { type: String, default: '' },
//   fileUrl:      { type: String },
//   mimeType:     { type: String },
//   originalName: { type: String },
//   timestamp:    { type: Date, default: Date.now },
// });

// // Private (DM) message schema
// // "participants" is always sorted alphabetically so queries are symmetric.
// const dmSchema = new mongoose.Schema({
//   from:         { type: String, required: true },
//   to:           { type: String, required: true },
//   participants: { type: [String], required: true }, // sorted [a, b]
//   text:         { type: String, default: '' },
//   fileUrl:      { type: String },
//   mimeType:     { type: String },
//   originalName: { type: String },
//   timestamp:    { type: Date, default: Date.now },
// });
// dmSchema.index({ participants: 1, timestamp: 1 });

// // Story schema — auto-expires after 24 h via MongoDB TTL index
// const storySchema = new mongoose.Schema({
//   userId:    { type: String, required: true },
//   username:  { type: String, required: true },
//   mediaUrl:  { type: String, required: true },
//   mimeType:  { type: String, default: "image/jpeg" },
//   caption:   { type: String, default: "" },
//   viewers:   { type: [String], default: [] },
//   createdAt: { type: Date, default: Date.now, expires: 86400 }, // TTL: 24 h
// });
// const Story = mongoose.model("Story", storySchema);

// const Post = mongoose.model("Post", postSchema);
// const User = mongoose.model("User", userSchema);
// const Message = mongoose.model("Message", messageSchema);
// const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
// const DmMessage = mongoose.model("DmMessage", dmSchema);

// // ── Multer storage config ─────────────────────────────────────────────────────
// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (_req, file, cb) => {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });

// const upload = multer({ storage });

// // ── In-memory presence tracking ───────────────────────────────────────────────
// // Maps userId -> Set<socketId>  (one user may have multiple tabs)
// const userSockets = new Map<string, Set<string>>();
// // Maps userId -> username
// const usernames   = new Map<string, string>();

// function onlineUsers(): { userId: string; username: string }[] {
//   return Array.from(userSockets.keys()).map(uid => ({
//     userId:   uid,
//     username: usernames.get(uid) || uid,
//   }));
// }

// function registerSocket(userId: string, socketId: string, username?: string) {
//   if (!userSockets.has(userId)) userSockets.set(userId, new Set());
//   userSockets.get(userId)!.add(socketId);
//   if (username) usernames.set(userId, username);
// }

// function unregisterSocket(userId: string, socketId: string) {
//   const sockets = userSockets.get(userId);
//   if (!sockets) return;
//   sockets.delete(socketId);
//   if (sockets.size === 0) userSockets.delete(userId);
// }

// // ── Socket.io ─────────────────────────────────────────────────────────────────
// io.on("connection", (socket) => {
//   let connectedUserId: string | null = null;

//   // ── Join: register user, send history, broadcast presence ──────────────────
//   socket.on("chat:join", async ({ userId, username }: { userId: string; username?: string }) => {
//     if (!userId) return;
//     connectedUserId = userId;

//     registerSocket(userId, socket.id, username);

//     // Send last 50 global messages to this client
//     const history = await ChatMessage.find()
//       .sort({ timestamp: -1 })
//       .limit(50)
//       .lean();
//     socket.emit("chat:history", history.reverse().map((m: any) => ({
//       _id:          m._id.toString(),
//       userId:       m.userId,
//       text:         m.text,
//       fileUrl:      m.fileUrl      ?? null,
//       mimeType:     m.mimeType     ?? null,
//       originalName: m.originalName ?? null,
//       timestamp:    m.timestamp,
//     })));

//     // Broadcast updated online user list to everyone
//     io.emit("chat:users", onlineUsers());
//     io.emit("chat:online", onlineUsers().length);

//     // Notify others
//     socket.broadcast.emit("chat:notification", `${userId} joined the chat`);
//   });

//   // ── Global message ──────────────────────────────────────────────────────────
//   socket.on(
//     "chat:message",
//     async ({ userId, text, fileUrl, mimeType, originalName }: {
//       userId: string; text: string;
//       fileUrl?: string; mimeType?: string; originalName?: string;
//     }) => {
//       if (!text?.trim() && !fileUrl) return;
//       if (!userId) return;

//       const chatDoc: any = {
//         userId,
//         text: text?.trim() || '',
//       };
//       if (fileUrl)      chatDoc.fileUrl      = fileUrl;
//       if (mimeType)     chatDoc.mimeType     = mimeType;
//       if (originalName) chatDoc.originalName = originalName;

//       const msg = await ChatMessage.create(chatDoc) as any;

//       io.emit("chat:message", {
//         _id:          msg._id.toString(),
//         userId:       msg.userId,
//         text:         msg.text,
//         fileUrl:      msg.fileUrl      ?? null,
//         mimeType:     msg.mimeType     ?? null,
//         originalName: msg.originalName ?? null,
//         timestamp:    msg.timestamp,
//       });
//     }
//   );

//   // ── DM history request ──────────────────────────────────────────────────────
//   socket.on("chat:dm:history", async ({ with: peer }: { with: string }) => {
//     if (!connectedUserId || !peer) return;

//     const participants = [connectedUserId, peer].sort();
//     const messages = await DmMessage.find({ participants })
//       .sort({ timestamp: 1 })
//       .limit(100)
//       .lean();

//     socket.emit("chat:dm:history", {
//       with: peer,
//       messages: messages.map((m: any) => ({
//         _id:          m._id.toString(),
//         from:         m.from,
//         to:           m.to,
//         text:         m.text,
//         fileUrl:      m.fileUrl      ?? null,
//         mimeType:     m.mimeType     ?? null,
//         originalName: m.originalName ?? null,
//         timestamp:    m.timestamp,
//       })),
//     });
//   });

//   // ── Private / DM message ────────────────────────────────────────────────────
//   socket.on(
//     "chat:dm",
//     async ({ from, to, text, fileUrl, mimeType, originalName }: {
//       from: string; to: string; text: string;
//       fileUrl?: string; mimeType?: string; originalName?: string;
//     }) => {
//       if (!from || !to || (!text?.trim() && !fileUrl)) return;

//       const participants = [from, to].sort();
//       const dmDoc: any = {
//         from, to, participants,
//         text: text?.trim() || '',
//       };
//       if (fileUrl)      dmDoc.fileUrl      = fileUrl;
//       if (mimeType)     dmDoc.mimeType     = mimeType;
//       if (originalName) dmDoc.originalName = originalName;

//       const msg = await DmMessage.create(dmDoc) as any;

//       const payload = {
//         _id:          msg._id.toString(),
//         from:         msg.from,
//         to:           msg.to,
//         text:         msg.text,
//         fileUrl:      msg.fileUrl      ?? null,
//         mimeType:     msg.mimeType     ?? null,
//         originalName: msg.originalName ?? null,
//         timestamp:    msg.timestamp,
//       };

//       // Send to all sockets belonging to the RECIPIENT
//       const recipientSockets = userSockets.get(to);
//       if (recipientSockets) {
//         recipientSockets.forEach((sid) => {
//           io.to(sid).emit("chat:dm", payload);
//         });
//       }

//       // Echo back to the SENDER's other sockets (other tabs)
//       const senderSockets = userSockets.get(from);
//       if (senderSockets) {
//         senderSockets.forEach((sid) => {
//           if (sid !== socket.id) io.to(sid).emit("chat:dm", payload);
//         });
//       }

//       // Confirm to this socket
//       socket.emit("chat:dm", payload);
//     }
//   );

//   // ── Delete global message ─────────────────────────────────────────────────
//   socket.on("chat:delete", async ({ msgId, userId }: { msgId: string; userId: string }) => {
//     if (!msgId || !userId) return;
//     const msg = await ChatMessage.findById(msgId) as any;
//     if (!msg) return;
//     if (msg.userId !== userId) return; // only owner can delete
//     await ChatMessage.findByIdAndDelete(msgId);
//     io.emit("chat:deleted", { msgId, scope: "global" });
//   });

//   // ── Delete DM message ──────────────────────────────────────────────────────
//   socket.on("chat:dm:delete", async ({ msgId, userId }: { msgId: string; userId: string }) => {
//     if (!msgId || !userId) return;
//     const msg = await DmMessage.findById(msgId) as any;
//     if (!msg) return;
//     if (msg.from !== userId) return; // only sender can delete
//     const peer = msg.from === userId ? msg.to : msg.from;
//     await DmMessage.findByIdAndDelete(msgId);
//     // Notify both sides
//     const allSockets = [
//       ...(userSockets.get(msg.from) || []),
//       ...(userSockets.get(msg.to)   || []),
//     ];
//     allSockets.forEach(sid => io.to(sid).emit("chat:deleted", { msgId, scope: "dm", peer }));
//   });

//   // ── Disconnect ──────────────────────────────────────────────────────────────
//   socket.on("disconnect", () => {
//     if (connectedUserId) {
//       unregisterSocket(connectedUserId, socket.id);
//       io.emit("chat:users", onlineUsers());
//       io.emit("chat:online", onlineUsers().length);
//     }
//   });
// });

// // ── REST Routes ───────────────────────────────────────────────────────────────

// app.get("/", (_req: Request, res: Response) => {
//   res.sendFile(path.join(__dirname, "../index.html"));
// });

// // Upload a post
// app.post("/upload", upload.single("image"), async (req: any, res: any) => {
//   if (!req.file) {
//     return res.status(400).send("No file uploaded");
//   }

//   const newPost = new Post({
//     userId: req.body.userId,
//     caption: req.body.caption,
//     imageUrl: `http://localhost:${port}/uploads/${req.file.filename}`,
//   });

//   await newPost.save();
//   res.json(newPost);
// });

// // Upload a chat attachment (file or voice note)
// app.post("/chat-upload", upload.single("file"), async (req: any, res: any) => {
//   if (!req.file) return res.status(400).send("No file uploaded");

//   const fileUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
//   const mimeType = req.file.mimetype;

//   res.json({ url: fileUrl, mimeType, originalName: req.file.originalname });
// });

// // Get all posts (with usernames and comment usernames resolved)
// app.get("/posts", async (_req: Request, res: Response) => {
//   const posts = await Post.find().sort({ _id: -1 });

//   const updatedPosts = await Promise.all(
//     posts.map(async (post) => {
//       const user = await User.findById(post.userId);

//       const updatedComments = await Promise.all(
//         post.comments.map(async (c: any) => {
//           const commentUser = await User.findById(c.userId);
//           return {
//             text: c.text,
//             userId: c.userId,
//             username: commentUser ? commentUser.username : "Unknown",
//           };
//         })
//       );

//       return {
//         ...post.toObject(),
//         username: user ? user.username : "Unknown",
//         comments: updatedComments,
//       };
//     })
//   );

//   res.json(updatedPosts);
// });

// // Like / unlike a post
// app.post("/like/:id", async (req: any, res: any) => {
//   if (!req.params.id) return res.status(400).send("Post ID missing");

//   const post = await Post.findById(req.params.id);
//   const userId = req.body.userId?.toString();

//   if (!post) return res.status(404).send("Post not found");
//   if (!userId) return res.status(400).send("User not provided");

//   if (post.likedUsers.includes(userId)) {
//     post.likedUsers = post.likedUsers.filter((u: any) => u !== userId);
//     post.likes = Math.max((post.likes || 0) - 1, 0);
//   } else {
//     post.likedUsers.push(userId);
//     post.likes = (post.likes || 0) + 1;
//   }

//   await post.save();
//   res.json(post);
// });

// // Add a comment
// app.post("/comment/:id", async (req: any, res: any) => {
//   if (!req.params.id) return res.status(400).send("Post ID missing");

//   const post = await Post.findById(req.params.id);

//   if (!post) return res.status(404).send("Post not found");
//   if (!req.body.comment) return res.status(400).send("Empty comment");

//   post.comments.push({ text: req.body.comment, userId: req.body.userId });
//   await post.save();

//   res.json(post);
// });

// // Sign up
// app.post("/signup", async (req: any, res: any) => {
//   const { username, password } = req.body;

//   const existingUser = await User.findOne({ username });
//   if (existingUser) return res.status(409).send("User already exists");

//   const newUser = new User({ username, password });
//   await newUser.save();

//   res.send("Signup successful");
// });

// // Log in
// app.post("/login", async (req: any, res: any) => {
//   const { username, password } = req.body;

//   const user = await User.findOne({ username });
//   if (!user) return res.status(404).send("User not found");
//   if (user.password !== password) return res.status(401).send("Wrong password");

//   res.json({ userId: user._id.toString(), username: user.username });
// });

// // Send a DM (REST fallback — prefer Socket.io for real-time)
// app.post("/send-message", async (req: any, res: any) => {
//   const { senderId, receiverId, text } = req.body;

//   const msg = new Message({ senderId, receiverId, text });
//   await msg.save();

//   res.json(msg);
// });

// // Get DM history between two users (REST fallback)
// app.get("/messages/:user1/:user2", async (req: Request, res: Response) => {
//   const { user1, user2 } = req.params;

//   const messages = await Message.find({
//     $or: [
//       { senderId: user1, receiverId: user2 },
//       { senderId: user2, receiverId: user1 },
//     ],
//   } as any).sort({ createdAt: 1 });

//   res.json(messages);
// });

// // Delete a post (owner only)
// app.delete("/post/:id", async (req: any, res: any) => {
//   const post = await Post.findById(req.params.id);
//   if (!post) return res.status(404).send("Post not found");
//   if (post.userId !== req.body.userId) return res.status(403).send("Not allowed");

//   await Post.findByIdAndDelete(req.params.id);
//   res.send("Post deleted");
// });

// // Delete a comment (comment owner or post owner)
// app.delete("/comment/:postId/:index", async (req: any, res: any) => {
//   const post = await Post.findById(req.params.postId);
//   if (!post) return res.status(404).send("Post not found");

//   const index = parseInt(req.params.index);
//   const userId = req.body.userId?.toString();

//   if (!userId) return res.status(400).send("User not provided");

//   const comment = post.comments[index];
//   if (!comment) return res.status(404).send("Comment not found");

//   const isCommentOwner = comment.userId === userId;
//   const isPostOwner = post.userId === userId;

//   if (!isCommentOwner && !isPostOwner) return res.status(403).send("Not allowed");

//   post.comments.splice(index, 1);
//   await post.save();

//   res.json(post);
// });

// // ── Story Routes ─────────────────────────────────────────────────────────────

// // Upload a story
// app.post("/story", upload.single("media"), async (req: any, res: any) => {
//   if (!req.file) return res.status(400).send("No file uploaded");

//   const user = await User.findById(req.body.userId);
//   if (!user) return res.status(404).send("User not found");

//   const story = await Story.create({
//     userId:   req.body.userId,
//     username: user.username ?? "",
//     mediaUrl: `http://localhost:${port}/uploads/${req.file.filename}`,
//     mimeType: req.file.mimetype,
//     caption:  req.body.caption || "",
//   });

//   res.json(story);
// });

// // Get all active stories (grouped by user)
// app.get("/stories", async (_req: Request, res: Response) => {
//   const stories = await Story.find().sort({ createdAt: -1 });

//   // Group by userId, keeping only the latest per user for the ring
//   const grouped: Record<string, any> = {};
//   stories.forEach((s: any) => {
//     if (!grouped[s.userId]) {
//       grouped[s.userId] = { userId: s.userId, username: s.username, stories: [] };
//     }
//     grouped[s.userId].stories.push({
//       _id:       s._id,
//       mediaUrl:  s.mediaUrl,
//       mimeType:  s.mimeType,
//       caption:   s.caption,
//       viewers:   s.viewers,
//       createdAt: s.createdAt,
//     });
//   });

//   res.json(Object.values(grouped));
// });

// // Mark story as viewed
// app.post("/story/view/:id", async (req: any, res: any) => {
//   const { userId } = req.body;
//   await Story.findByIdAndUpdate(req.params.id, { $addToSet: { viewers: userId } });
//   res.json({ ok: true });
// });

// // Delete own story
// app.delete("/story/:id", async (req: any, res: any) => {
//   const story = await Story.findById(req.params.id) as any;
//   if (!story) return res.status(404).send("Story not found");
//   if (story.userId !== req.body.userId) return res.status(403).send("Not allowed");
//   await Story.findByIdAndDelete(req.params.id);
//   res.json({ ok: true });
// });

// // ── Start ─────────────────────────────────────────────────────────────────────
// httpServer.listen(port, () => {
//   console.log(`Wiser running on http://localhost:${port}`);
// });

// import express, { Request, Response } from "express";
// import multer from "multer";
// import path from "path";
// import mongoose from "mongoose";
// import { createServer } from "http";
// import { Server } from "socket.io";

// const app = express();
// const port = 3000;

// // ── HTTP + Socket.io bootstrap ────────────────────────────────────────────────
// const httpServer = createServer(app);
// const io = new Server(httpServer);

// // ── Static / Middleware ───────────────────────────────────────────────────────
// app.use("/uploads", express.static("uploads"));
// app.use(express.static(path.join(__dirname, "../")));
// app.use(express.json());

// // ── MongoDB ───────────────────────────────────────────────────────────────────
// mongoose
//   .connect("mongodb://localhost:27017/wiser")
//   .then(() => console.log("Connected: mongodb://localhost:27017/wiser"))
//   .catch((err) => console.log(err));

// // ── Schemas & Models ──────────────────────────────────────────────────────────
// const postSchema = new mongoose.Schema({
//   userId: String,
//   caption: String,
//   imageUrl: String,
//   likes: { type: Number, default: 0 },
//   likedUsers: [String],
//   comments: [
//     {
//       text: String,
//       userId: String,
//     },
//   ],
// });

// const userSchema = new mongoose.Schema({
//   username: String,
//   password: String,
// });

// const messageSchema = new mongoose.Schema({
//   senderId: String,
//   receiverId: String,
//   text: String,
//   createdAt: { type: Date, default: Date.now },
// });

// // Global chat message schema
// const chatMessageSchema = new mongoose.Schema({
//   userId:       { type: String, required: true },
//   text:         { type: String, default: '' },
//   fileUrl:      { type: String },
//   mimeType:     { type: String },
//   originalName: { type: String },
//   timestamp:    { type: Date, default: Date.now },
// });

// // Private (DM) message schema
// // "participants" is always sorted alphabetically so queries are symmetric.
// const dmSchema = new mongoose.Schema({
//   from:         { type: String, required: true },
//   to:           { type: String, required: true },
//   participants: { type: [String], required: true }, // sorted [a, b]
//   text:         { type: String, default: '' },
//   fileUrl:      { type: String },
//   mimeType:     { type: String },
//   originalName: { type: String },
//   timestamp:    { type: Date, default: Date.now },
// });
// dmSchema.index({ participants: 1, timestamp: 1 });

// // Story schema — auto-expires after 24 h via MongoDB TTL index
// const storySchema = new mongoose.Schema({
//   userId:    { type: String, required: true },
//   username:  { type: String, required: true },
//   mediaUrl:  { type: String, required: true },
//   mimeType:  { type: String, default: "image/jpeg" },
//   caption:   { type: String, default: "" },
//   viewers:   { type: [String], default: [] },
//   createdAt: { type: Date, default: Date.now, expires: 86400 }, // TTL: 24 h
// });
// const Story = mongoose.model("Story", storySchema);

// const Post = mongoose.model("Post", postSchema);
// const User = mongoose.model("User", userSchema);
// const Message = mongoose.model("Message", messageSchema);
// const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
// const DmMessage = mongoose.model("DmMessage", dmSchema);

// // ── Multer storage config ─────────────────────────────────────────────────────
// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (_req, file, cb) => {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });

// const upload = multer({ storage });

// // ── In-memory presence tracking ───────────────────────────────────────────────
// // Maps userId -> Set<socketId>  (one user may have multiple tabs)
// const userSockets = new Map<string, Set<string>>();
// // Maps userId -> username
// const usernames   = new Map<string, string>();

// function onlineUsers(): { userId: string; username: string }[] {
//   return Array.from(userSockets.keys()).map(uid => ({
//     userId:   uid,
//     username: usernames.get(uid) || uid,
//   }));
// }

// function registerSocket(userId: string, socketId: string, username?: string) {
//   if (!userSockets.has(userId)) userSockets.set(userId, new Set());
//   userSockets.get(userId)!.add(socketId);
//   if (username) usernames.set(userId, username);
// }

// function unregisterSocket(userId: string, socketId: string) {
//   const sockets = userSockets.get(userId);
//   if (!sockets) return;
//   sockets.delete(socketId);
//   if (sockets.size === 0) userSockets.delete(userId);
// }

// // ── Socket.io ─────────────────────────────────────────────────────────────────
// io.on("connection", (socket) => {
//   let connectedUserId: string | null = null;

//   // ── Join: register user, send history, broadcast presence ──────────────────
//   socket.on("chat:join", async ({ userId, username }: { userId: string; username?: string }) => {
//     if (!userId) return;
//     connectedUserId = userId;

//     registerSocket(userId, socket.id, username);

//     // Send last 50 global messages to this client
//     const history = await ChatMessage.find()
//       .sort({ timestamp: -1 })
//       .limit(50)
//       .lean();
//     socket.emit("chat:history", history.reverse().map((m: any) => ({
//       _id:          m._id.toString(),
//       userId:       m.userId,
//       text:         m.text,
//       fileUrl:      m.fileUrl      ?? null,
//       mimeType:     m.mimeType     ?? null,
//       originalName: m.originalName ?? null,
//       timestamp:    m.timestamp,
//     })));

//     // Broadcast updated online user list to everyone
//     io.emit("chat:users", onlineUsers());
//     io.emit("chat:online", onlineUsers().length);

//     // Notify others
//     socket.broadcast.emit("chat:notification", `${userId} joined the chat`);
//   });

//   // ── Global message ──────────────────────────────────────────────────────────
//   socket.on(
//     "chat:message",
//     async ({ userId, text, fileUrl, mimeType, originalName }: {
//       userId: string; text: string;
//       fileUrl?: string; mimeType?: string; originalName?: string;
//     }) => {
//       if (!text?.trim() && !fileUrl) return;
//       if (!userId) return;

//       const chatDoc: any = {
//         userId,
//         text: text?.trim() || '',
//       };
//       if (fileUrl)      chatDoc.fileUrl      = fileUrl;
//       if (mimeType)     chatDoc.mimeType     = mimeType;
//       if (originalName) chatDoc.originalName = originalName;

//       const msg = await ChatMessage.create(chatDoc) as any;

//       io.emit("chat:message", {
//         _id:          msg._id.toString(),
//         userId:       msg.userId,
//         text:         msg.text,
//         fileUrl:      msg.fileUrl      ?? null,
//         mimeType:     msg.mimeType     ?? null,
//         originalName: msg.originalName ?? null,
//         timestamp:    msg.timestamp,
//       });
//     }
//   );

//   // ── DM history request ──────────────────────────────────────────────────────
//   socket.on("chat:dm:history", async ({ with: peer }: { with: string }) => {
//     if (!connectedUserId || !peer) return;

//     const participants = [connectedUserId, peer].sort();
//     const messages = await DmMessage.find({ participants })
//       .sort({ timestamp: 1 })
//       .limit(100)
//       .lean();

//     socket.emit("chat:dm:history", {
//       with: peer,
//       messages: messages.map((m: any) => ({
//         _id:          m._id.toString(),
//         from:         m.from,
//         to:           m.to,
//         text:         m.text,
//         fileUrl:      m.fileUrl      ?? null,
//         mimeType:     m.mimeType     ?? null,
//         originalName: m.originalName ?? null,
//         timestamp:    m.timestamp,
//       })),
//     });
//   });

//   // ── Private / DM message ────────────────────────────────────────────────────
//   socket.on(
//     "chat:dm",
//     async ({ from, to, text, fileUrl, mimeType, originalName }: {
//       from: string; to: string; text: string;
//       fileUrl?: string; mimeType?: string; originalName?: string;
//     }) => {
//       if (!from || !to || (!text?.trim() && !fileUrl)) return;

//       const participants = [from, to].sort();
//       const dmDoc: any = {
//         from, to, participants,
//         text: text?.trim() || '',
//       };
//       if (fileUrl)      dmDoc.fileUrl      = fileUrl;
//       if (mimeType)     dmDoc.mimeType     = mimeType;
//       if (originalName) dmDoc.originalName = originalName;

//       const msg = await DmMessage.create(dmDoc) as any;

//       const payload = {
//         _id:          msg._id.toString(),
//         from:         msg.from,
//         to:           msg.to,
//         text:         msg.text,
//         fileUrl:      msg.fileUrl      ?? null,
//         mimeType:     msg.mimeType     ?? null,
//         originalName: msg.originalName ?? null,
//         timestamp:    msg.timestamp,
//       };

//       // Send to all sockets belonging to the RECIPIENT
//       const recipientSockets = userSockets.get(to);
//       if (recipientSockets) {
//         recipientSockets.forEach((sid) => {
//           io.to(sid).emit("chat:dm", payload);
//         });
//       }

//       // Echo back to the SENDER's other sockets (other tabs)
//       const senderSockets = userSockets.get(from);
//       if (senderSockets) {
//         senderSockets.forEach((sid) => {
//           if (sid !== socket.id) io.to(sid).emit("chat:dm", payload);
//         });
//       }

//       // Confirm to this socket
//       socket.emit("chat:dm", payload);
//     }
//   );

//   // ── Delete global message ─────────────────────────────────────────────────
//   socket.on("chat:delete", async ({ msgId, userId }: { msgId: string; userId: string }) => {
//     if (!msgId || !userId) return;
//     const msg = await ChatMessage.findById(msgId) as any;
//     if (!msg) return;
//     if (msg.userId !== userId) return; // only owner can delete
//     await ChatMessage.findByIdAndDelete(msgId);
//     io.emit("chat:deleted", { msgId, scope: "global" });
//   });

//   // ── Delete DM message ──────────────────────────────────────────────────────
//   socket.on("chat:dm:delete", async ({ msgId, userId }: { msgId: string; userId: string }) => {
//     if (!msgId || !userId) return;
//     const msg = await DmMessage.findById(msgId) as any;
//     if (!msg) return;
//     if (msg.from !== userId) return; // only sender can delete
//     const peer = msg.from === userId ? msg.to : msg.from;
//     await DmMessage.findByIdAndDelete(msgId);
//     // Notify both sides
//     const allSockets = [
//       ...(userSockets.get(msg.from) || []),
//       ...(userSockets.get(msg.to)   || []),
//     ];
//     allSockets.forEach(sid => io.to(sid).emit("chat:deleted", { msgId, scope: "dm", peer }));
//   });

//   // ── Disconnect ──────────────────────────────────────────────────────────────
//   socket.on("disconnect", () => {
//     if (connectedUserId) {
//       unregisterSocket(connectedUserId, socket.id);
//       io.emit("chat:users", onlineUsers());
//       io.emit("chat:online", onlineUsers().length);
//     }
//   });
// });

// // ── REST Routes ───────────────────────────────────────────────────────────────

// app.get("/", (_req: Request, res: Response) => {
//   res.sendFile(path.join(__dirname, "../index.html"));
// });

// // Upload a post
// app.post("/upload", upload.single("image"), async (req: any, res: any) => {
//   if (!req.file) {
//     return res.status(400).send("No file uploaded");
//   }

//   const newPost = new Post({
//     userId: req.body.userId,
//     caption: req.body.caption,
//     imageUrl: `http://localhost:${port}/uploads/${req.file.filename}`,
//   });

//   await newPost.save();
//   res.json(newPost);
// });

// // Upload a chat attachment (file or voice note)
// app.post("/chat-upload", upload.single("file"), async (req: any, res: any) => {
//   if (!req.file) return res.status(400).send("No file uploaded");

//   const fileUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
//   const mimeType = req.file.mimetype;

//   res.json({ url: fileUrl, mimeType, originalName: req.file.originalname });
// });

// // Get all posts (with usernames and comment usernames resolved)
// app.get("/posts", async (_req: Request, res: Response) => {
//   const posts = await Post.find().sort({ _id: -1 });

//   const updatedPosts = await Promise.all(
//     posts.map(async (post) => {
//       const user = await User.findById(post.userId);

//       const updatedComments = await Promise.all(
//         post.comments.map(async (c: any) => {
//           const commentUser = await User.findById(c.userId);
//           return {
//             text: c.text,
//             userId: c.userId,
//             username: commentUser ? commentUser.username : "Unknown",
//           };
//         })
//       );

//       return {
//         ...post.toObject(),
//         username: user ? user.username : "Unknown",
//         comments: updatedComments,
//       };
//     })
//   );

//   res.json(updatedPosts);
// });

// // Like / unlike a post
// app.post("/like/:id", async (req: any, res: any) => {
//   if (!req.params.id) return res.status(400).send("Post ID missing");

//   const post = await Post.findById(req.params.id);
//   const userId = req.body.userId?.toString();

//   if (!post) return res.status(404).send("Post not found");
//   if (!userId) return res.status(400).send("User not provided");

//   if (post.likedUsers.includes(userId)) {
//     post.likedUsers = post.likedUsers.filter((u: any) => u !== userId);
//     post.likes = Math.max((post.likes || 0) - 1, 0);
//   } else {
//     post.likedUsers.push(userId);
//     post.likes = (post.likes || 0) + 1;
//   }

//   await post.save();
//   res.json(post);
// });

// // Add a comment
// app.post("/comment/:id", async (req: any, res: any) => {
//   if (!req.params.id) return res.status(400).send("Post ID missing");

//   const post = await Post.findById(req.params.id);

//   if (!post) return res.status(404).send("Post not found");
//   if (!req.body.comment) return res.status(400).send("Empty comment");

//   post.comments.push({ text: req.body.comment, userId: req.body.userId });
//   await post.save();

//   res.json(post);
// });

// // Sign up
// app.post("/signup", async (req: any, res: any) => {
//   const { username, password } = req.body;

//   const existingUser = await User.findOne({ username });
//   if (existingUser) return res.status(409).send("User already exists");

//   const newUser = new User({ username, password });
//   await newUser.save();

//   res.send("Signup successful");
// });

// // Log in
// app.post("/login", async (req: any, res: any) => {
//   const { username, password } = req.body;

//   const user = await User.findOne({ username });
//   if (!user) return res.status(404).send("User not found");
//   if (user.password !== password) return res.status(401).send("Wrong password");

//   res.json({ userId: user._id.toString(), username: user.username });
// });

// // Send a DM (REST fallback — prefer Socket.io for real-time)
// app.post("/send-message", async (req: any, res: any) => {
//   const { senderId, receiverId, text } = req.body;

//   const msg = new Message({ senderId, receiverId, text });
//   await msg.save();

//   res.json(msg);
// });

// // Get DM history between two users (REST fallback)
// app.get("/messages/:user1/:user2", async (req: Request, res: Response) => {
//   const { user1, user2 } = req.params;

//   const messages = await Message.find({
//     $or: [
//       { senderId: user1, receiverId: user2 },
//       { senderId: user2, receiverId: user1 },
//     ],
//   } as any).sort({ createdAt: 1 });

//   res.json(messages);
// });

// // Delete a post (owner only)
// app.delete("/post/:id", async (req: any, res: any) => {
//   const post = await Post.findById(req.params.id);
//   if (!post) return res.status(404).send("Post not found");
//   if (post.userId !== req.body.userId) return res.status(403).send("Not allowed");

//   await Post.findByIdAndDelete(req.params.id);
//   res.send("Post deleted");
// });

// // Delete a comment (comment owner or post owner)
// app.delete("/comment/:postId/:index", async (req: any, res: any) => {
//   const post = await Post.findById(req.params.postId);
//   if (!post) return res.status(404).send("Post not found");

//   const index = parseInt(req.params.index);
//   const userId = req.body.userId?.toString();

//   if (!userId) return res.status(400).send("User not provided");

//   const comment = post.comments[index];
//   if (!comment) return res.status(404).send("Comment not found");

//   const isCommentOwner = comment.userId === userId;
//   const isPostOwner = post.userId === userId;

//   if (!isCommentOwner && !isPostOwner) return res.status(403).send("Not allowed");

//   post.comments.splice(index, 1);
//   await post.save();

//   res.json(post);
// });

// // ── Story Routes ─────────────────────────────────────────────────────────────

// // Upload a story
// app.post("/story", upload.single("media"), async (req: any, res: any) => {
//   if (!req.file) return res.status(400).send("No file uploaded");

//   const user = await User.findById(req.body.userId);
//   if (!user) return res.status(404).send("User not found");

//   const story = await Story.create({
//     userId:   req.body.userId,
//     username: user.username ?? "",
//     mediaUrl: `http://localhost:${port}/uploads/${req.file.filename}`,
//     mimeType: req.file.mimetype,
//     caption:  req.body.caption || "",
//   });

//   res.json(story);
// });

// // Get all active stories (grouped by user)
// app.get("/stories", async (_req: Request, res: Response) => {
//   const stories = await Story.find().sort({ createdAt: -1 });

//   // Collect all unique viewer userIds across all stories
//   const allViewerIds = [...new Set(stories.flatMap((s: any) => s.viewers as string[]))];

//   // Bulk-fetch usernames for all viewers
//   const viewerUsers = await User.find({ _id: { $in: allViewerIds } });
//   const viewerMap: Record<string, string> = {};
//   viewerUsers.forEach((u: any) => {
//     viewerMap[u._id.toString()] = u.username ?? "Unknown";
//   });

//   // Group by userId
//   const grouped: Record<string, any> = {};
//   stories.forEach((s: any) => {
//     if (!grouped[s.userId]) {
//       grouped[s.userId] = { userId: s.userId, username: s.username, stories: [] };
//     }

//     // Resolve viewer userIds -> { userId, username }
//     const viewerDetails = (s.viewers as string[]).map((vid: string) => ({
//       userId:   vid,
//       username: viewerMap[vid] ?? "Unknown",
//     }));

//     grouped[s.userId].stories.push({
//       _id:          s._id,
//       mediaUrl:     s.mediaUrl,
//       mimeType:     s.mimeType,
//       caption:      s.caption,
//       viewers:      s.viewers,        // keep raw array for seen/unseen check
//       viewerDetails,                  // enriched list for the owner
//       createdAt:    s.createdAt,
//     });
//   });

//   res.json(Object.values(grouped));
// });

// // Mark story as viewed
// app.post("/story/view/:id", async (req: any, res: any) => {
//   const { userId } = req.body;
//   await Story.findByIdAndUpdate(req.params.id, { $addToSet: { viewers: userId } });
//   res.json({ ok: true });
// });

// // Delete own story
// app.delete("/story/:id", async (req: any, res: any) => {
//   const story = await Story.findById(req.params.id) as any;
//   if (!story) return res.status(404).send("Story not found");
//   if (story.userId !== req.body.userId) return res.status(403).send("Not allowed");
//   await Story.findByIdAndDelete(req.params.id);
//   res.json({ ok: true });
// });

// // ── Start ─────────────────────────────────────────────────────────────────────
// httpServer.listen(port, () => {
//   console.log(`Wiser running on http://localhost:${port}`);
// });

import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";

const app        = express();
const port       = 3000;
const httpServer = createServer(app);
const io         = new Server(httpServer);

// ── Static / Middleware ───────────────────────────────────────────────────────
app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, "../")));
app.use(express.json());

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose
  .connect("mongodb://localhost:27017/wiser")
  .then(() => console.log("Connected: mongodb://localhost:27017/wiser"))
  .catch((err) => console.log(err));

// ── Schemas & Models ──────────────────────────────────────────────────────────
const postSchema = new mongoose.Schema({
  userId:     String,
  caption:    String,
  imageUrl:   String,
  likes:      { type: Number, default: 0 },
  likedUsers: [String],
  comments:   [{ text: String, userId: String }],
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const messageSchema = new mongoose.Schema({
  senderId:   String,
  receiverId: String,
  text:       String,
  createdAt:  { type: Date, default: Date.now },
});

const chatMessageSchema = new mongoose.Schema({
  userId:       { type: String, required: true },
  text:         { type: String, default: '' },
  fileUrl:      { type: String },
  mimeType:     { type: String },
  originalName: { type: String },
  timestamp:    { type: Date, default: Date.now },
});

const dmSchema = new mongoose.Schema({
  from:         { type: String, required: true },
  to:           { type: String, required: true },
  participants: { type: [String], required: true },
  text:         { type: String, default: '' },
  fileUrl:      { type: String },
  mimeType:     { type: String },
  originalName: { type: String },
  timestamp:    { type: Date, default: Date.now },
});
dmSchema.index({ participants: 1, timestamp: 1 });

const storySchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  username:  { type: String, required: true },
  mediaUrl:  { type: String, required: true },
  mimeType:  { type: String, default: "image/jpeg" },
  caption:   { type: String, default: "" },
  viewers:   { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now, expires: 86400 },
});

const Post        = mongoose.model("Post",        postSchema);
const User        = mongoose.model("User",        userSchema);
const Message     = mongoose.model("Message",     messageSchema);
const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
const DmMessage   = mongoose.model("DmMessage",   dmSchema);
const Story       = mongoose.model("Story",       storySchema);

// ── Multer ────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"),
  filename:    (_req, file,  cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ── In-memory presence ────────────────────────────────────────────────────────
// userId -> Set<socketId>
const userSockets = new Map<string, Set<string>>();
const usernames   = new Map<string, string>();

function onlineUsers(): { userId: string; username: string }[] {
  return Array.from(userSockets.keys()).map(uid => ({
    userId:   uid,
    username: usernames.get(uid) || uid,
  }));
}

function registerSocket(userId: string, socketId: string, username?: string) {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId)!.add(socketId);
  if (username) usernames.set(userId, username);
}

function unregisterSocket(userId: string, socketId: string) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) userSockets.delete(userId);
}

// Send to all sockets belonging to a user
function emitToUser(userId: string, event: string, data: any) {
  const sockets = userSockets.get(userId);
  if (sockets) sockets.forEach(sid => io.to(sid).emit(event, data));
}

// ── Socket.io ─────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  let connectedUserId: string | null = null;

  // ── Presence / join ────────────────────────────────────────────────────────
  socket.on("chat:join", async ({ userId, username }: { userId: string; username?: string }) => {
    if (!userId) return;
    connectedUserId = userId;
    registerSocket(userId, socket.id, username);

    const history = await ChatMessage.find()
      .sort({ timestamp: -1 }).limit(50).lean();
    socket.emit("chat:history", history.reverse().map((m: any) => ({
      _id: m._id.toString(), userId: m.userId, text: m.text,
      fileUrl: m.fileUrl ?? null, mimeType: m.mimeType ?? null,
      originalName: m.originalName ?? null, timestamp: m.timestamp,
    })));

    io.emit("chat:users",  onlineUsers());
    io.emit("chat:online", onlineUsers().length);
    socket.broadcast.emit("chat:notification", `${username || userId} joined`);
  });

  // ── Global chat message ────────────────────────────────────────────────────
  socket.on("chat:message", async ({ userId, text, fileUrl, mimeType, originalName }: any) => {
    if (!text?.trim() && !fileUrl) return;
    if (!userId) return;
    const doc: any = { userId, text: text?.trim() || '' };
    if (fileUrl)      doc.fileUrl      = fileUrl;
    if (mimeType)     doc.mimeType     = mimeType;
    if (originalName) doc.originalName = originalName;
    const msg = await ChatMessage.create(doc) as any;
    io.emit("chat:message", {
      _id: msg._id.toString(), userId: msg.userId, text: msg.text,
      fileUrl: msg.fileUrl ?? null, mimeType: msg.mimeType ?? null,
      originalName: msg.originalName ?? null, timestamp: msg.timestamp,
    });
  });

  // ── DM history ────────────────────────────────────────────────────────────
  socket.on("chat:dm:history", async ({ with: peer }: { with: string }) => {
    if (!connectedUserId || !peer) return;
    const participants = [connectedUserId, peer].sort();
    const messages = await DmMessage.find({ participants })
      .sort({ timestamp: 1 }).limit(100).lean();
    socket.emit("chat:dm:history", {
      with: peer,
      messages: messages.map((m: any) => ({
        _id: m._id.toString(), from: m.from, to: m.to, text: m.text,
        fileUrl: m.fileUrl ?? null, mimeType: m.mimeType ?? null,
        originalName: m.originalName ?? null, timestamp: m.timestamp,
      })),
    });
  });

  // ── DM send ───────────────────────────────────────────────────────────────
  socket.on("chat:dm", async ({ from, to, text, fileUrl, mimeType, originalName }: any) => {
    if (!from || !to || (!text?.trim() && !fileUrl)) return;
    const participants = [from, to].sort();
    const doc: any = { from, to, participants, text: text?.trim() || '' };
    if (fileUrl)      doc.fileUrl      = fileUrl;
    if (mimeType)     doc.mimeType     = mimeType;
    if (originalName) doc.originalName = originalName;
    const msg = await DmMessage.create(doc) as any;
    const payload = {
      _id: msg._id.toString(), from: msg.from, to: msg.to, text: msg.text,
      fileUrl: msg.fileUrl ?? null, mimeType: msg.mimeType ?? null,
      originalName: msg.originalName ?? null, timestamp: msg.timestamp,
    };
    emitToUser(to,   "chat:dm", payload);
    emitToUser(from, "chat:dm", payload);
  });

  // ── Delete global ─────────────────────────────────────────────────────────
  socket.on("chat:delete", async ({ msgId, userId }: any) => {
    const msg = await ChatMessage.findById(msgId) as any;
    if (!msg || msg.userId !== userId) return;
    await ChatMessage.findByIdAndDelete(msgId);
    io.emit("chat:deleted", { msgId, scope: "global" });
  });

  // ── Delete DM ─────────────────────────────────────────────────────────────
  socket.on("chat:dm:delete", async ({ msgId, userId }: any) => {
    const msg = await DmMessage.findById(msgId) as any;
    if (!msg || msg.from !== userId) return;
    await DmMessage.findByIdAndDelete(msgId);
    const allSids = [
      ...(userSockets.get(msg.from) || []),
      ...(userSockets.get(msg.to)   || []),
    ];
    allSids.forEach(sid =>
      io.to(sid).emit("chat:deleted", { msgId, scope: "dm", peer: msg.to })
    );
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  WebRTC SIGNALLING  ── voice & video calling
  //
  //  Call lifecycle:
  //    1. caller emits  call:offer    → server relays → callee  (incoming ring)
  //    2. callee emits  call:answer   → server relays → caller  (connected)
  //       OR callee emits call:reject → server relays → caller  (declined)
  //    3. both sides exchange call:ice for ICE candidates
  //    4. either side emits call:end  → server relays → peer    (hung up)
  // ════════════════════════════════════════════════════════════════════════════

  socket.on("call:offer", ({ to, from, fromName, offer, callType }: {
    to: string; from: string; fromName: string;
    offer: RTCSessionDescriptionInit; callType: "audio" | "video";
  }) => {
    emitToUser(to, "call:incoming", { from, fromName, offer, callType });
  });

  socket.on("call:answer", ({ to, from, answer }: {
    to: string; from: string; answer: RTCSessionDescriptionInit;
  }) => {
    emitToUser(to, "call:answered", { from, answer });
  });

  socket.on("call:ice", ({ to, candidate }: {
    to: string; candidate: RTCIceCandidateInit;
  }) => {
    emitToUser(to, "call:ice", { candidate });
  });

  socket.on("call:end", ({ to, from }: { to: string; from: string }) => {
    emitToUser(to, "call:ended", { from });
  });

  socket.on("call:reject", ({ to, from }: { to: string; from: string }) => {
    emitToUser(to, "call:rejected", { from });
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    if (connectedUserId) {
      unregisterSocket(connectedUserId, socket.id);
      io.emit("chat:users",  onlineUsers());
      io.emit("chat:online", onlineUsers().length);
    }
  });
});

// ── REST Routes ───────────────────────────────────────────────────────────────

app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "../index.html")));

app.post("/upload", upload.single("image"), async (req: any, res: any) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  const newPost = new Post({
    userId: req.body.userId, caption: req.body.caption,
    imageUrl: `http://localhost:${port}/uploads/${req.file.filename}`,
  });
  await newPost.save();
  res.json(newPost);
});

app.post("/chat-upload", upload.single("file"), async (req: any, res: any) => {
  if (!req.file) return res.status(400).send("No file");
  res.json({
    url: `http://localhost:${port}/uploads/${req.file.filename}`,
    mimeType: req.file.mimetype,
    originalName: req.file.originalname,
  });
});

app.get("/posts", async (_req, res) => {
  const posts = await Post.find().sort({ _id: -1 });
  const updated = await Promise.all(posts.map(async post => {
    const user = await User.findById(post.userId);
    const comments = await Promise.all(post.comments.map(async (c: any) => {
      const cu = await User.findById(c.userId);
      return { text: c.text, userId: c.userId, username: cu?.username || "Unknown" };
    }));
    return { ...post.toObject(), username: user?.username || "Unknown", comments };
  }));
  res.json(updated);
});

app.post("/like/:id", async (req: any, res: any) => {
  const post = await Post.findById(req.params.id);
  const uid  = req.body.userId?.toString();
  if (!post) return res.status(404).send("Post not found");
  if (!uid)  return res.status(400).send("User not provided");
  if (post.likedUsers.includes(uid)) {
    post.likedUsers = post.likedUsers.filter((u: any) => u !== uid);
    post.likes = Math.max((post.likes || 0) - 1, 0);
  } else {
    post.likedUsers.push(uid);
    post.likes = (post.likes || 0) + 1;
  }
  await post.save();
  res.json(post);
});

app.post("/comment/:id", async (req: any, res: any) => {
  const post = await Post.findById(req.params.id);
  if (!post)            return res.status(404).send("Post not found");
  if (!req.body.comment) return res.status(400).send("Empty comment");
  post.comments.push({ text: req.body.comment, userId: req.body.userId });
  await post.save();
  res.json(post);
});

app.post("/signup", async (req: any, res: any) => {
  const { username, password } = req.body;
  if (await User.findOne({ username })) return res.status(409).send("User already exists");
  await new User({ username, password }).save();
  res.send("Signup successful");
});

app.post("/login", async (req: any, res: any) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user)                      return res.status(404).send("User not found");
  if (user.password !== password) return res.status(401).send("Wrong password");
  res.json({ userId: user._id.toString(), username: user.username });
});

app.post("/send-message", async (req: any, res: any) => {
  const msg = new Message(req.body);
  await msg.save();
  res.json(msg);
});

app.get("/messages/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  const messages = await Message.find({
    $or: [{ senderId: user1, receiverId: user2 }, { senderId: user2, receiverId: user1 }],
  } as any).sort({ createdAt: 1 });
  res.json(messages);
});

app.delete("/post/:id", async (req: any, res: any) => {
  const post = await Post.findById(req.params.id);
  if (!post)                           return res.status(404).send("Post not found");
  if (post.userId !== req.body.userId) return res.status(403).send("Not allowed");
  await Post.findByIdAndDelete(req.params.id);
  res.send("Post deleted");
});

app.delete("/comment/:postId/:index", async (req: any, res: any) => {
  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).send("Post not found");
  const index = parseInt(req.params.index);
  const uid   = req.body.userId?.toString();
  if (!uid)  return res.status(400).send("User not provided");
  const comment = post.comments[index];
  if (!comment) return res.status(404).send("Comment not found");
  if (comment.userId !== uid && post.userId !== uid) return res.status(403).send("Not allowed");
  post.comments.splice(index, 1);
  await post.save();
  res.json(post);
});

app.post("/story", upload.single("media"), async (req: any, res: any) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  const user = await User.findById(req.body.userId);
  if (!user)  return res.status(404).send("User not found");
  const story = await Story.create({
    userId: req.body.userId, username: user.username ?? "",
    mediaUrl: `http://localhost:${port}/uploads/${req.file.filename}`,
    mimeType: req.file.mimetype, caption: req.body.caption || "",
  });
  res.json(story);
});

app.get("/stories", async (_req, res) => {
  const stories = await Story.find().sort({ createdAt: -1 });
  const allViewerIds = [...new Set(stories.flatMap((s: any) => s.viewers as string[]))];
  const viewerUsers  = await User.find({ _id: { $in: allViewerIds } });
  const viewerMap: Record<string, string> = {};
  viewerUsers.forEach((u: any) => { viewerMap[u._id.toString()] = u.username ?? "Unknown"; });
  const grouped: Record<string, any> = {};
  stories.forEach((s: any) => {
    if (!grouped[s.userId])
      grouped[s.userId] = { userId: s.userId, username: s.username, stories: [] };
    grouped[s.userId].stories.push({
      _id: s._id, mediaUrl: s.mediaUrl, mimeType: s.mimeType,
      caption: s.caption, viewers: s.viewers,
      viewerDetails: (s.viewers as string[]).map((vid: string) => ({
        userId: vid, username: viewerMap[vid] ?? "Unknown",
      })),
      createdAt: s.createdAt,
    });
  });
  res.json(Object.values(grouped));
});

app.post("/story/view/:id", async (req: any, res: any) => {
  await Story.findByIdAndUpdate(req.params.id, { $addToSet: { viewers: req.body.userId } });
  res.json({ ok: true });
});

app.delete("/story/:id", async (req: any, res: any) => {
  const story = await Story.findById(req.params.id) as any;
  if (!story)                           return res.status(404).send("Story not found");
  if (story.userId !== req.body.userId) return res.status(403).send("Not allowed");
  await Story.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ── Start ─────────────────────────────────────────────────────────────────────
httpServer.listen(port, () => console.log(`Wiser running on http://localhost:${port}`));