const mongoose = require("mongoose");
const { conn } = require("../databases/connection");
const encrypt = require("mongoose-encryption");

const archiveSchema = mongoose.Schema(
  {
    user: mongoose.Types.ObjectId,
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
    },
    school: mongoose.Types.ObjectId,
    schoolId: String,
    schoolName: String,
    data: Object,
    files: Object,
  },
  { timestamps: true }
);

// archiveSchema.index(
//   {
//     school: 1,
//     userId: 1,
//   },
//   { unique: true }
// );

archiveSchema.plugin(encrypt, {
  encryptionKey: process.env["ENCKEY_A"],
  signingKey: process.env["SIGKEY_A"],
  encryptedFields: ["data", "files"],
});

archiveSchema.methods.clean = async function () {
  const user = this;
  try {
    user.data["인적 사항"]["주민등록번호"] = "000000-111111";
    user.data["인적 사항"]["주소"] = "아름다운 이땅에 금수강산에";
    user.data["인적 사항"]["성명(부)"] = "아버지";
    user.data["인적 사항"]["생년월일(부)"] = "2022년11월16일";
    user.data["인적 사항"]["성명(모)"] = "어머니";
    user.data["인적 사항"]["생년월일(모)"] = "2022년11월16일";
    return;
  } catch (err) {
    return err;
  }
};

module.exports = (dbName) => {
  return conn[dbName].model("Archive", archiveSchema);
};
