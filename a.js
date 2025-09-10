/**
 * プロファイル取得中の公開鍵を追跡するSet
 * 重複したリクエストを避けるために使用します。
 */
const pubkeysInProgress = new Set();

/**
 * NostrのKind:0 (Profile) イベントを解析し、プロファイル情報をprofilesオブジェクトに保存します。
 *
 * @param {object} nostrEv - Nostrイベントオブジェクト (Kind:0)
 * @param {object} profiles - プロファイル情報を保持するオブジェクト
 * @returns {void}
 */
export const updateProfile = (nostrEv, profiles) => {
    // Kind:0イベントか確認
    if (nostrEv.kind !== 0) {
        console.error("updateProfile関数はKind:0イベントのみを受け付けます。");
        return;
    }

    try {
        // イベントのcontent (JSON文字列) をパース
        const profileContent = JSON.parse(nostrEv.content);
        // パブリックキーをキーとしてプロファイル情報を保存
        profiles[nostrEv.pubkey] = profileContent;
        console.log(`公開鍵: ${nostrEv.pubkey.substring(0, 8)}... のプロファイルを更新しました。`);
    } catch (error) {
        console.error("プロフィールコンテンツのパースに失敗しました:", error);
    }
};

/**
 * プロファイル情報から表示名を取得します。
 * 存在しない場合は、公開鍵の短縮形を返します。
 *
 * @param {string} pubkey - ユーザーの公開鍵 (hex)
 * @param {object} profiles - プロファイル情報を保持するオブジェクト
 * @returns {string} - 表示名、または公開鍵の短縮形
 */
export const getDisplayName = (pubkey, profiles) => {
    // profilesオブジェクトに公開鍵が存在するか確認
    if (profiles[pubkey] && profiles[pubkey].name) {
        // プロファイル名が存在する場合、その名前を返す
        return profiles[pubkey].name;
    }
    // プロファイル名が存在しない場合、公開鍵の短縮形を返す
    return pubkey.substring(0, 8);
};

/**
 * 未取得のKind:0プロファイルを複数のリレーから取得します。
 * @param {string[]} pubkeysToFetch - プロファイルをフェッチする公開鍵の配列
 * @param {object} profiles - プロファイル情報を保持するオブジェクト (メインスクリプトと共有)
 * @param {Function} onProfilesFetched - プロファイル取得後に呼び出されるコールバック関数
 */
export const fetchProfilesForPubkeys = (pubkeysToFetch, profiles, onProfilesFetched) => {
    const pubkeys = new Set();
    // 既に取得済みまたは取得中の公開鍵を除外
    for (const pubkey of pubkeysToFetch) {
        if (!profiles[pubkey] && !pubkeysInProgress.has(pubkey)) {
            pubkeys.add(pubkey);
            pubkeysInProgress.add(pubkey);
        }
    }

    if (pubkeys.size === 0) {
        console.log("フェッチ対象のプロファイルはありませんでした。");
        return;
    }

    const PROFILE_SUB_ID = "motherfuncking-profile-sub-" + Date.now();
    const profileRelayWS = new WebSocket("wss://relay.nostr.band");

    profileRelayWS.addEventListener("open", () => {
        console.log(`プロファイルリレーに接続しました。${pubkeys.size}件のプロファイルをリクエストします。`);
        profileRelayWS.send(JSON.stringify(["REQ", PROFILE_SUB_ID, {
            kinds: [0],
            authors: Array.from(pubkeys)
        }]));
    });

    profileRelayWS.addEventListener("message", ev => {
        try {
            const r2cMsg = JSON.parse(ev.data);
            if (r2cMsg[0] === "EVENT" && r2cMsg[2].kind === 0) {
                const nostrEv = r2cMsg[2];
                // メインスクリプトと共有のprofilesオブジェクトを更新
                updateProfile(nostrEv, profiles);
                // 取得が完了したので、進行中リストから削除
                pubkeysInProgress.delete(nostrEv.pubkey);
                // プロファイルが取得されるたびにタイムラインを再描画
                if (typeof onProfilesFetched === 'function') {
                    onProfilesFetched();
                }
            } else if (r2cMsg[0] === "EOSE" && r2cMsg[1] === PROFILE_SUB_ID) {
                console.log("プロファイルリレーからEOSEを受信しました。接続を閉じます。");
                profileRelayWS.close();
            }
        } catch (err) {
            console.error("プロファイルイベントの処理に失敗しました:", err);
        }
    });

    profileRelayWS.addEventListener("close", () => {
        console.log("プロファイルリレーとの接続が閉じられました。");
        // 取得できなかった公開鍵を進行中リストから削除
        pubkeys.forEach(pubkey => pubkeysInProgress.delete(pubkey));
    });

    profileRelayWS.addEventListener("error", err => {
        console.error("プロファイルリレーとの接続でエラーが発生しました:", err);
        // エラーが発生した公開鍵を進行中リストから削除
        pubkeys.forEach(pubkey => pubkeysInProgress.delete(pubkey));
    });
};
