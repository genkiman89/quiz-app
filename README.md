# クイズ回答アプリ — 利用の手引き

参加者がスマホで QR コードを読み、テーブル番号と名前を入れて選択式クイズに回答。管理者は集計や正解者一覧を確認し、ルーレットで当選者を決められます。

## フォルダ構成（Git に入れやすい形）

- **quiz-app/** … アプリのソースコードがすべて入っている **1 つのフォルダ** です。  
  - 起動やデプロイは、すべて **この quiz-app フォルダの中** で行います。
- **README.md**（このファイル）… 説明書。リポジトリのルートにあります。
- **.gitignore** … Git で追跡しないファイル（node_modules や data など）の指定です。

リポジトリを clone したり ZIP で取得したら、**quiz-app フォルダに移動してから** 以下の「セットアップ」「起動」を実行してください。

---

## 目次

1. [必要なもの](#1-必要なもの)
2. [自分のパソコンで動かす（初回セットアップ）](#2-自分のパソコンで動かす初回セットアップ)
3. [起動して使う](#3-起動して使う)
4. [画面の説明（誰が何をするか）](#4-画面の説明誰が何をするか)
5. [パスワードをかけたい場合](#5-パスワードをかけたい場合)
6. [インターネットに公開する](#6-インターネットに公開する)
7. [MongoDB を用意する（データを残したいとき）](#7-mongodb-を用意するデータを残したいとき)
8. [GitHub にコードを預ける](#8-github-にコードを預ける)
9. [Render にデプロイする](#9-render-にデプロイする)
10. [環境変数一覧](#10-環境変数一覧)
11. [うまく動かないとき](#11-うまく動かないとき)

---

## 1. 必要なもの

- **Node.js**（このアプリを動かすための実行環境）
  - まだ入っていない場合: [Node.js の公式サイト](https://nodejs.org/ja/) を開き、**LTS** と書いてある方をダウンロードしてインストールする。
  - インストール後、ターミナル（コマンドプロンプトや PowerShell）で `node -v` と入力して Enter。バージョン番号が出れば OK。
- **quiz-app フォルダ**（クイズアプリのソースコード）
  - リポジトリのルートにある **quiz-app** という名前のフォルダです。ここに server.js、package.json、store、public が入っています。

---

## 2. 自分のパソコンで動かす（初回セットアップ）

**一度だけ**、次の手順を実行します。

1. **ターミナルを開く**
   - Windows: スタートメニューで「PowerShell」または「コマンドプロンプト」を検索して開く。
   - Mac: 「ターミナル」を起動する。

2. **quiz-app フォルダに移動する**
   - 例（リポジトリを clone した場合）:
     ```powershell
     cd C:\Users\あなたのユーザー名\Desktop\cursor-tutor\quiz-app
     ```
   - Cursor で開いている場合は、ターミナルで `cd quiz-app` と入力して Enter でもよいです。

3. **必要なパッケージをインストールする**
   - 次のコマンドを **1 行ずつ** 入力して Enter（`npm` のつづりに注意。`nmp` ではない）。
     ```powershell
     npm install
     ```
   - 必ず **quiz-app の中にいる状態で** 実行してください。
   - 初回は数十秒かかることがあります。エラーが出ずに終われば成功です。

ここまでで「セットアップ完了」です。次からは「起動して使う」だけです。

---

## 3. 起動して使う

1. **ターミナルで、quiz-app フォルダにいる状態で**、次のコマンドを実行する。
   ```powershell
   npm start
   ```
2. **「Server is running on http://localhost:3000」** のような表示が出たら起動成功です。
3. **ブラウザで次の URL を開く。**
   - **管理用（出題者・運営）**: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)
   - **参加者用（クイズ回答）**: [http://localhost:3000/](http://localhost:3000/)
4. 終了したいときは、ターミナルで **Ctrl + C** を押す。

※ 同じパソコン内で「管理用」と「参加者用」を別タブで開いて試せます。他のスマホから参加させたい場合は、後述の「インターネットに公開する」が必要です。

---

## 4. 画面の説明（誰が何をするか）

### 管理画面（admin.html）— 出題者・運営が使う

- **クイズ設定**: タイトル・問題文・選択肢を入力し「設定を保存」。正解の選択肢は、ここでは選ばずに後で決えてもよい。
- **選択肢ごとの集計**: 回答が集まると、選択肢ごとの人数が棒グラフで表示される。誰が何を選んだかは一覧でも確認できる。
- **正解発表と抽選**: 「正解の選択肢」で正解を選び、「正解を確定して抽選を開始」を押すと、正解者の中からルーレットで当選者が決まる。

### 回答画面（トップページ /）— 参加者が使う

- テーブル番号と名前を入力し、問題の選択肢を 1 つ選んで「回答を送信する」。
- 送信後は「〇〇と回答しました」とだけ表示され、正解かどうかはこの時点では表示されない（管理者が後で正解を発表する想定）。

---

## 5. パスワードをかけたい場合

管理画面と回答画面に、それぞれ別のパスワードをかけられます。

1. **quiz-app フォルダに移動したあと、起動する前に**、ターミナルで次の 2 行を実行する（パスワードは好きな文字列に変えてよい）。
   ```powershell
   cd quiz-app
   $env:ADMIN_PASSWORD="管理用のパスワード"
   $env:QUIZ_PASSWORD="参加者に伝えるパスワード"
   npm start
   ```
2. すでに quiz-app にいる場合は、`$env:...` の 2 行と `npm start` だけ実行すればよいです。
3. ブラウザで開くと:
   - 管理画面: まずログイン画面が出る → 上で設定した「管理用のパスワード」を入力。
   - 回答画面: まずパスワード入力画面が出る → 参加者に伝えた「参加者用パスワード」を入力するとクイズが表示される。

※ パスワードを設定しないと、誰でも URL を知っていればアクセスできます。インターネットに公開するときは、必ず両方のパスワードを設定してください。

---

## 6. インターネットに公開する

「会場の Wi‑Fi に繋いだスマホから、同じ URL で参加したい」「自宅のパソコンでサーバを動かさず、クラウド上で動かしたい」場合は、アプリを **インターネット上にデプロイ（公開）** します。

**流れのイメージ**

1. **データを残す仕組み（MongoDB）を用意する**（無料でできる。後述）
2. **コードを GitHub に預ける**（「このコードで動かして」と指定するため）
3. **Render などのサービスで「この GitHub のコードを動かす」ように設定する**
4. 発行された URL が「管理画面」「回答画面」の共通の入口になる

以下、MongoDB → GitHub → Render の順に、できるだけクリック手順で書きます。GitHub や MongoDB を触ったことがなくても進められるようにしています。

---

## 7. MongoDB を用意する（データを残したいとき）

**MongoDB とは**  
データベースの一種です。ここでは「クイズの内容」と「回答一覧」を保存するために使います。  
無料のクラウド版 **MongoDB Atlas** を使うと、自分のパソコンにデータベースを入れなくても、インターネット上に保存場所を用意できます。

**なぜ必要か**  
Render などの無料プランでは、再デプロイやスリープのときに、アプリ内の「ファイルに書いたデータ」が消えることがあります。MongoDB に保存しておくと、アプリを再起動してもデータが残ります。

### 7.1 MongoDB Atlas のアカウントとクラスター作成

1. ブラウザで [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) を開く。
2. **「Try Free」** または **「無料で始める」** をクリック。
3. メールアドレスとパスワードでアカウントを作成（無料）。
4. ログイン後、**「Build a Database」**（データベースを構築）をクリック。
5. **「M0 FREE」** を選び、**「Create」** をクリック（無料枠）。
6. クラスターができるまで少し待つ。**「Database」** 一覧にクラスター名（例: Cluster0）が出ていれば OK。

### 7.2 データベースにログインするユーザーを作る

1. 左メニューの **「Database Access」**（データベースアクセス）をクリック。
2. **「Add New Database User」** をクリック。
3. **Authentication Method** は **「Password」** のまま。
4. **Username** に好きな名前（例: `quizuser`）、**Password** に好きなパスワードを入力。**このパスワードはあとで接続文字列に使うので、メモしておく。**
5. **「Add User」** をクリック。

### 7.3 どこからでもアクセスできるようにする

1. 左メニューの **「Network Access」**（ネットワークアクセス）をクリック。
2. **「Add IP Address」** をクリック。
3. **「Allow Access from Anywhere」** を選ぶ（表示される IP は `0.0.0.0/0`）。**「Confirm」** をクリック。
   - これで、Render などのサーバから Atlas のデータベースに接続できます。

### 7.4 接続文字列（MONGODB_URI）を取得する

1. 左メニューの **「Database」** に戻る。
2. 作成したクラスター（例: Cluster0）の **「Connect」** をクリック。
3. **「Connect your application」**（アプリケーションで接続）を選ぶ。
4. **Driver** は **Node.js**、**Version** はそのままでよい。  
   表示されている **接続用の URL** をコピーする。  
   例: `mongodb+srv://quizuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
5. この URL の **`<password>`** の部分を、**7.2 で決めたパスワード** に置き換える。  
   - パスワードに `@` や `#` などが含まれる場合は、[MongoDB のドキュメント](https://www.mongodb.com/docs/manual/reference/connection-string/) を参照してエスケープする。
6. 置き換えた文字列全体が **MONGODB_URI** です。  
   例: `mongodb+srv://quizuser:mypass123@cluster0.xxxxx.mongodb.net/quiz?retryWrites=true&w=majority`  
   （`/quiz` の部分はデータベース名。そのままでよい。）

**ローカルで試す場合**（PowerShell・quiz-app フォルダに移動してから）:

```powershell
cd quiz-app
$env:MONGODB_URI="ここに上で作った接続文字列を貼り付け"
npm start
```

起動ログに **「(保存: MongoDB)」** と出ていれば、MongoDB に接続できています。

---

## 8. GitHub にコードを預ける

**GitHub とは**  
プログラムのソースコードを保存・共有するための Web サービスです。  
ここでは「Render が、どのコードを動かすか」を指定するために使います。「Git」や「プッシュ」が初めてでも、次の手順だけ押さえれば大丈夫です。

### 8.1 GitHub のアカウントとリポジトリ作成

1. [https://github.com](https://github.com) を開き、アカウントを作成（まだの場合）。
2. ログイン後、右上の **「+」** → **「New repository」** をクリック。
3. **Repository name** に好きな名前を入力（例: `quiz-app`）。
4. **Public** を選び、**「Create repository」** をクリック。
5. 作成されたページの **「…or push an existing repository from the command line」** のところに、2 行のコマンドが表示される。あとで使う。

### 8.2 自分のパソコンから GitHub に送る（初回だけ）

1. **Git が入っているか確認する**  
   ターミナルで `git --version` と入力。バージョンが出なければ、[Git の公式](https://git-scm.com/) からインストールする。

2. **リポジトリのルートフォルダで**（README.md や .gitignore がある場所。quiz-app の**親フォルダ**）、次のコマンドを **1 回ずつ** 実行する。  
   （`あなたのユーザー名` と `リポジトリ名` は、8.1 で作ったリポジトリに合わせて変える。）
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/あなたのユーザー名/リポジトリ名.git
   git push -u origin main
   ```
   - `git add .` で、**quiz-app フォルダ・README.md・.gitignore** が追加されます（node_modules と data は .gitignore で除外されます）。

3. 最後の `git push` で、GitHub のユーザー名とパスワード（またはトークン）を聞かれたら入力する。  
   パスワードは「Personal access token」を使う必要がある場合があります（GitHub の Settings → Developer settings → Personal access tokens で発行）。

送信が成功すると、GitHub のリポジトリページに、README.md、.gitignore、**quiz-app** フォルダ（その中に server.js や public など）が表示されます。

---

## 9. Render にデプロイする

**Render とは**  
GitHub に預けたコードを、インターネット上で 24 時間動かしてくれるサービスです。無料プランがあります。

### 9.1 Web サービスを作成

1. [https://render.com](https://render.com) を開き、アカウントを作成（GitHub でログインすると連携が楽）。
2. ダッシュボードで **「New +」** → **「Web Service」** をクリック。
3. **「Connect a repository」** で、8 で作成した **リポジトリ** を選ぶ。表示されない場合は「Configure account」で GitHub と連携する。
4. 次のように設定する。
   - **Name**: 好きな名前（例: `quiz-app`）。
   - **Root Directory**: **`quiz-app`** と入力する。  
     （アプリのコードが quiz-app フォルダに入っているため。ここを空にするとルートで npm start しようとして失敗します。）
   - **Region**: 近い地域を選択。
   - **Runtime**: **Node**。
   - **Build Command**: `npm install`（空欄のままでもよい）。
   - **Start Command**: `npm start`。
5. **「Advanced」** を開き、**「Add Environment Variable」** で次の 3 つを追加する。

   | Key | Value |
   |-----|--------|
   | `ADMIN_PASSWORD` | 管理画面用のパスワード（自分で決める） |
   | `QUIZ_PASSWORD` | 参加者に伝えるパスワード（自分で決める） |
   | `MONGODB_URI` | 7.4 でメモした接続文字列をそのまま貼り付け |

6. **「Create Web Service」** をクリック。
7. 数分待つと、画面上部に **「Your service is live at https://xxxx.onrender.com」** のような URL が表示される。これがアプリの入口です。

### 9.2 使い方

- **管理画面**: `https://xxxx.onrender.com/admin.html` を開く。パスワード（ADMIN_PASSWORD）を入力してログイン。
- **参加者**: `https://xxxx.onrender.com/` を開く。パスワード（QUIZ_PASSWORD）を入力するとクイズが表示される。
- **QR コード**: 参加者用 URL（`https://xxxx.onrender.com/`）を、QR コード生成サイト（例: [QRコード生成](https://www.qr-code-generator.com/)）で QR コードにし、会場で掲示する。

※ 無料プランでは、しばらくアクセスがないとスリープし、次のアクセス時に数十秒かかることがあります。

---

## 10. 環境変数一覧

| 変数名 | 説明 |
|--------|------|
| `ADMIN_PASSWORD` | 管理画面用パスワード。設定すると管理画面と管理 API が保護される。 |
| `QUIZ_PASSWORD` | 回答サイト用パスワード。設定するとトップページでパスワード入力後にのみクイズが表示される。 |
| `MONGODB_URI` | MongoDB の接続文字列。設定するとクイズ・回答を DB に保存する（未設定時は `data/` の JSON ファイル）。 |
| `PORT` | サーバのポート（省略時は 3000）。多くのホスティングでは自動設定される。 |
| `NODE_ENV` | `production` にすると Cookie が HTTPS のみで送信される。本番では設定推奨。 |

---

## 11. うまく動かないとき

- **「npm は認識されません」**  
  Node.js をインストールしたあと、ターミナルを**いったん閉じて開き直して**から、もう一度 `npm start` を試す。

- **「スクリプトの実行が無効になっている」**（PowerShell）  
  管理者用に PowerShell で実行ポリシーを変更する:  
  `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`  
  または、**コマンドプロンプト（cmd）** で `npm start` を実行する。

- **管理画面や回答画面が真っ白**  
  - ブラウザのアドレスが `http://localhost:3000` と `http://localhost:3000/admin.html` になっているか確認。`https` ではなく `http`。  
  - **quiz-app フォルダで** `npm start` しているか確認（ルートで実行すると package.json がなくて失敗します）。

- **MongoDB に接続できない**  
  - MONGODB_URI の `<password>` を、実際のパスワードに置き換えたか確認。  
  - Network Access で「Allow Access from Anywhere」を追加したか確認。  
  - パスワードに `@` や `#` が含まれる場合はエスケープが必要。

- **Render で「Application failed to start」**  
  - Start Command が `npm start` になっているか確認。  
  - 環境変数（ADMIN_PASSWORD, QUIZ_PASSWORD, MONGODB_URI）が正しく設定されているか確認。

---

## Cursor の基本（開発環境）

- コードを選択して **Cmd+K**（Mac）または **Ctrl+K**（Windows）で編集を依頼できる。
- 右サイドバーのチャットで、コードやエラーについて質問できる。
- リントエラーにマウスを乗せて「Fix in chat」で修正案を出せる。

問題やフィードバックは hi@cursor.so まで。
