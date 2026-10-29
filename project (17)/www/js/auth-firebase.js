"use strict";
// ===== メール確認による学生認証（Firebase Authentication） =====
//
// このアプリのログイン自体は、これまで通りローカル(APP.users)とMonacaデータベースの 照合で行う。Firebase Authenticationは「本当にそのメールアドレスを持っているか」を確認するためだけに、横で並行して使う。
// 流れ：
//   1. 新規登録時：Firebase Authにも同じメール/パスワードでアカウントを作り、確認メールを送信
//   2. ログイン時：Firebase Authにもサインインし直し、emailVerifiedを確認
//   3. 確認が済んでいなければ、確認待ち画面を表示する

// 新規登録時：Firebase Authアカウントを作成し、確認メールを送信する
async function registerAndSendVerification(email, password) {
  let cred;
  try {
    cred = await fireAuth.createUserWithEmailAndPassword(email, password);
  } catch (e) {
    if (e.code === "auth/email-already-in-use") {
      // 既にFirebase Auth側にアカウントがある場合は、そのままサインインして続行
      cred = await fireAuth.signInWithEmailAndPassword(email, password);
    } else {
      throw e;
    }
  }
  await cred.user.sendEmailVerification();
  return cred.user;
}

// ログイン時：Firebase Authにもサインインし、確認済みかどうかを返す
async function checkEmailVerified(email, password) {
  const cred = await fireAuth.signInWithEmailAndPassword(email, password);
  await cred.user.reload();
  return fireAuth.currentUser.emailVerified;
}

// 確認メールを再送信する（サインイン済みである必要がある）
async function resendVerificationEmail() {
  if (!fireAuth.currentUser) throw new Error("再送信にはログインが必要です。");
  await fireAuth.currentUser.sendEmailVerification();
}

// 現在Firebase Authにサインイン中のユーザーの確認状態を再取得する
async function refreshEmailVerified() {
  if (!fireAuth.currentUser) return false;
  await fireAuth.currentUser.reload();
  return fireAuth.currentUser.emailVerified;
}

// 退会時：Firebase Authのアカウント自体を削除する
async function deleteFirebaseAuthAccount() {
  if (!fireAuth.currentUser) return; // サインインしていなければ何もしない
  await fireAuth.currentUser.delete();
}
