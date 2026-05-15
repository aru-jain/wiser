"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var multer_1 = require("multer");
var path_1 = require("path");
var mongoose_1 = require("mongoose");
var app = (0, express_1.default)();
var port = 3000;
app.use("/uploads", express_1.default.static("uploads"));
app.use(express_1.default.static(path_1.default.join(__dirname, "../")));
app.use(express_1.default.json());
mongoose_1.default.connect("mongodb://localhost:27017/wiser")
    .then(function () {
    console.log("mongodb://localhost:27017/wiser");
})
    .catch(function (err) {
    console.log(err);
});
var postSchema = new mongoose_1.default.Schema({
    userId: String,
    caption: String,
    imageUrl: String,
    likes: { type: Number, default: 0 },
    likedUsers: [String],
    comments: [
        {
            text: String,
            userId: String
        }
    ]
});
var Post = mongoose_1.default.model("Post", postSchema);
var userSchema = new mongoose_1.default.Schema({
    username: String,
    password: String
});
var User = mongoose_1.default.model("User", userSchema);
var messageSchema = new mongoose_1.default.Schema({
    senderId: String,
    receiverId: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
});
var Message = mongoose_1.default.model("Message", messageSchema);
// storage config
var storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
var upload = (0, multer_1.default)({ storage: storage });
app.get("/", function (req, res) {
    res.sendFile(path_1.default.join(__dirname, "../index.html"));
});
// route to upload post
app.post("/upload", upload.single("image"), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var newPost;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!req.file) {
                    return [2 /*return*/, res.send("No file uploaded")];
                }
                newPost = new Post({
                    userId: req.body.userId,
                    caption: req.body.caption,
                    imageUrl: "http://localhost:3000/uploads/".concat(req.file.filename)
                });
                return [4 /*yield*/, newPost.save()];
            case 1:
                _a.sent();
                res.json(newPost);
                return [2 /*return*/];
        }
    });
}); });
app.get("/posts", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var posts, updatedPosts;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Post.find()];
            case 1:
                posts = _a.sent();
                return [4 /*yield*/, Promise.all(posts.map(function (post) { return __awaiter(void 0, void 0, void 0, function () {
                        var user, updatedComments;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, User.findById(post.userId)];
                                case 1:
                                    user = _a.sent();
                                    return [4 /*yield*/, Promise.all(post.comments.map(function (c) { return __awaiter(void 0, void 0, void 0, function () {
                                            var commentUser;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, User.findById(c.userId)];
                                                    case 1:
                                                        commentUser = _a.sent();
                                                        return [2 /*return*/, {
                                                                text: c.text,
                                                                userId: c.userId,
                                                                username: commentUser ? commentUser.username : "Unknown"
                                                            }];
                                                }
                                            });
                                        }); }))];
                                case 2:
                                    updatedComments = _a.sent();
                                    return [2 /*return*/, __assign(__assign({}, post.toObject()), { username: user ? user.username : "Unknown", comments: updatedComments })];
                            }
                        });
                    }); }))];
            case 2:
                updatedPosts = _a.sent();
                res.json(updatedPosts);
                return [2 /*return*/];
        }
    });
}); });
app.post("/like/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var post, userId;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!req.params.id) {
                    return [2 /*return*/, res.send("Post ID missing")];
                }
                return [4 /*yield*/, Post.findById(req.params.id)];
            case 1:
                post = _b.sent();
                userId = (_a = req.body.userId) === null || _a === void 0 ? void 0 : _a.toString();
                if (!post)
                    return [2 /*return*/, res.send("Post not found")];
                if (!userId)
                    return [2 /*return*/, res.send("User not provided")];
                if (post.likedUsers.includes(userId)) {
                    post.likedUsers = post.likedUsers.filter(function (u) { return u !== userId; });
                    post.likes = Math.max((post.likes || 0) - 1, 0);
                }
                else {
                    post.likedUsers.push(userId);
                    post.likes = (post.likes || 0) + 1;
                }
                return [4 /*yield*/, post.save()];
            case 2:
                _b.sent();
                res.json(post);
                return [2 /*return*/];
        }
    });
}); });
app.post("/comment/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var post;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!req.params.id) {
                    return [2 /*return*/, res.send("Post ID missing")];
                }
                return [4 /*yield*/, Post.findById(req.params.id)];
            case 1:
                post = _a.sent();
                if (!post)
                    return [2 /*return*/, res.send("Post not found")];
                if (!req.body.comment)
                    return [2 /*return*/, res.send("Empty comment")];
                post.comments.push({
                    text: req.body.comment,
                    userId: req.body.userId
                });
                return [4 /*yield*/, post.save()];
            case 2:
                _a.sent();
                res.json(post);
                return [2 /*return*/];
        }
    });
}); });
app.post("/signup", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, password, existingUser, newUser;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, username = _a.username, password = _a.password;
                return [4 /*yield*/, User.findOne({ username: username })];
            case 1:
                existingUser = _b.sent();
                if (existingUser) {
                    return [2 /*return*/, res.send("User already exists")];
                }
                newUser = new User({ username: username, password: password });
                return [4 /*yield*/, newUser.save()];
            case 2:
                _b.sent();
                res.send("Signup successful");
                return [2 /*return*/];
        }
    });
}); });
app.post("/login", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, password, user;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, username = _a.username, password = _a.password;
                return [4 /*yield*/, User.findOne({ username: username })];
            case 1:
                user = _b.sent();
                if (!user)
                    return [2 /*return*/, res.send("User not found")];
                if (user.password !== password) {
                    return [2 /*return*/, res.send("Wrong password")];
                }
                res.json({
                    userId: user._id.toString()
                });
                return [2 /*return*/];
        }
    });
}); });
app.post("/send-message", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, senderId, receiverId, text, msg;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, senderId = _a.senderId, receiverId = _a.receiverId, text = _a.text;
                msg = new Message({
                    senderId: senderId,
                    receiverId: receiverId,
                    text: text
                });
                return [4 /*yield*/, msg.save()];
            case 1:
                _b.sent();
                res.json(msg);
                return [2 /*return*/];
        }
    });
}); });
app.get("/messages/:user1/:user2", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, user1, user2, messages;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.params, user1 = _a.user1, user2 = _a.user2;
                return [4 /*yield*/, Message.find({
                        $or: [
                            { senderId: user1, receiverId: user2 },
                            { senderId: user2, receiverId: user1 }
                        ]
                    }).sort({ createdAt: 1 })];
            case 1:
                messages = _b.sent();
                res.json(messages);
                return [2 /*return*/];
        }
    });
}); });
app.delete("/post/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var post;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Post.findById(req.params.id)];
            case 1:
                post = _a.sent();
                if (!post)
                    return [2 /*return*/, res.send("Post not found")];
                // ✅ only owner can delete
                if (post.userId !== req.body.userId) {
                    return [2 /*return*/, res.send("Not allowed")];
                }
                return [4 /*yield*/, Post.findByIdAndDelete(req.params.id)];
            case 2:
                _a.sent();
                res.send("Post deleted");
                return [2 /*return*/];
        }
    });
}); });
app.delete("/comment/:postId/:index", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var post, index, userId, comment, isCommentOwner, isPostOwner;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, Post.findById(req.params.postId)];
            case 1:
                post = _b.sent();
                if (!post)
                    return [2 /*return*/, res.send("Post not found")];
                index = parseInt(req.params.index);
                userId = (_a = req.body.userId) === null || _a === void 0 ? void 0 : _a.toString();
                if (!userId)
                    return [2 /*return*/, res.send("User not provided")];
                comment = post.comments[index];
                if (!comment)
                    return [2 /*return*/, res.send("Comment not found")];
                isCommentOwner = comment.userId === userId;
                isPostOwner = post.userId === userId;
                if (!isCommentOwner && !isPostOwner) {
                    return [2 /*return*/, res.send("Not allowed")];
                }
                post.comments.splice(index, 1);
                return [4 /*yield*/, post.save()];
            case 2:
                _b.sent();
                res.json(post);
                return [2 /*return*/];
        }
    });
}); });
app.listen(port, function () {
    console.log("Server running on port ".concat(port));
});
