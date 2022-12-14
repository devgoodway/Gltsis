const mongoose = require("mongoose");
const { conn } = require("../databases/connection");

const userSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const notificationSchema = mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["sent", "received"],
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },

    // when type is 'sent'
    toUserList: [userSchema],
    // when type is 'received'
    fromUserId: String,
    fromUserName: String,
    checked: Boolean,

    category: String,
    title: {
      type: String,
      required: true,
    },
    description: String,
  },
  { timestamps: true }
);

notificationSchema.index({
  type: 1,
  userId: 1,
  createdAt: -1,
});

module.exports = (dbName) => {
  return conn[dbName].model("Notification", notificationSchema);
};
