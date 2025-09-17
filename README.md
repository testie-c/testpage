イベントビューアを作っています。GitHub Pagesでホストしている静的サイトで、現在 `/tweetsrecap/` がトップページです。
新たに、詳細ページを作りたいです。HTMLとJavaScriptのみで構成します。

以下の仕様に沿って、詳細ページのHTMLとJavaScriptを生成してください：

【基本構成】
- クエリパラメータ `nevent` を受け取り、Bech32デコードしてイベントIDを取得
- `wss://relay.nostr.band` を基本リレーとしてイベントを取得
- kind:1 の投稿本文、投稿者プロフィール（kind:0）を表示
- 投稿者アイコンは円形（2rem）、名前とnip05（またはnpub）を横並びで表示
- 投稿日時はローカル時間に変換し、viaタグ（client名）も横に表示
- 投稿本文は改行を `<br>` に変換、URLは自動リンク化、絵文字はそのまま表示
- 投稿に含まれる `nostr:` リンクは自分の `/tweet?nevent=...` に変換してリンク化
- 投稿に画像URLが含まれていたら、サムネイル表示（NIP-27対応）

【リアクション・関連イベント】
- kind:7（リアクション）は絵文字ごとにグループ化し、リアクションした人のアイコン（1.2rem円形）を並べて表示
- kind:6,16（リポスト・引用）は投稿時間順に並べて、小さな投稿カード風に表示
- `e`, `p`, `q`タグに含まれるイベントは、自分のビューアへのリンクとして表示

【UI要素】
- ページ上部と下部に「もどる」ボタンを配置
  - `window.history.length > 1 ? history.back() : location.href = "/tweetsrecap"` の分岐で戻る
- 右上にURLコピー用ボタンを配置（「もどる」ボタンとflexでspace-between）

【CSS】
- 既存の `/tweetsrecap/` のCSSをベースにして、統一感のあるデザインにしてください
- 必要なら、以下のCSSの一部を参考にしても構いません（省略可）

（ここで、前回送ったCSSの一部を貼り付けてもOK）

【エラーハンドリング】
- イベントが取得できなかった場合は「イベントが見つかりませんでした」と表示

この仕様に沿って、HTMLとJavaScriptを生成してください。

なお、JavaScriptは `<script src="https://unpkg.com/nostr-tools@1.17.0/lib/nostr.bundle.js"></script>` を使っており、`nostr-tools` の機能はグローバルスコープで利用可能です。
そのため、`nip19.decode()` や `relay.send()` などは `window.nostrTools` 経由ではなく、直接使える前提でコードを生成してください。
