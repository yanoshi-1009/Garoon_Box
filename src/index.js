const OAuth = require("oauthio-web");
jQuery.noConflict();
(function($) {
  "use strict";

  const OauthioAppName = "box";
  const OauthPublicKey = "CUD0SaOqvV9OuCNnznpCB6OOi5I";
  const boxFileId = "526904357462";
  const targetEvent = ["打合"];

  async function getAccessToken() {
    OAuth.initialize(OauthPublicKey);
    const authResult = await OAuth.popup(OauthioAppName, { cache: true });
    return authResult.access_token;
  }

  async function copyNote(accessToken) {
    const proxyCode = "copyNote"; // Garoonで定義
    const noteName = garoon.schedule.event.get().subject;
    const url = `https://api.box.com/2.0/files/${boxFileId}/copy`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    };
    const data = {
      parent: {
        id: "0"
      },
      name: `${noteName}.boxnote`
    };
    return garoon.base.proxy.send(proxyCode, url, "POST", headers, data);
  }

  async function createSharedLink(id, accessToken) {
    const proxyCode = "createSharedLink";
    const url = `https://api.box.com/2.0/files/${id}?fields=shared_link`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    };
    const data = {
      shared_link: {
        access: "company"
      }
    };
    return garoon.base.proxy.send(proxyCode, url, "PUT", headers, data);
  }

  const setSharedLinkToSchedule = sharedLink => {
    const scheduleId = garoon.schedule.event.get().id;
    const url = `/api/v1/schedule/events/${scheduleId}`;
    const params = {
      additionalItems: {
        item: {
          value: sharedLink
        }
      }
    };
    garoon.api(url, "PATCH", params, () => {
      location.reload();
    });
  };

  async function createNote() {
    const accessToken = await getAccessToken();
    if (accessToken == null) {
      return;
    }
    const resultOfCopy = await copyNote(accessToken);
    const fileId = JSON.parse(resultOfCopy[0]).id;
    const resultOfCreateLink = await createSharedLink(fileId, accessToken);
    const sharedLink = JSON.parse(resultOfCreateLink[0]).shared_link.url;
    setSharedLinkToSchedule(sharedLink);
  }

  const showCreateBotton = () => {
    $("#create-note-button").click(createNote);
    $("#create-note-button").show();
  };

  const showExistedNote = sharedLink => {
    const sharedLinkValue = sharedLink.replace("https://app.box.com/s/", "");
    const embeddedUrl = `https://app.box.com/embed/s/${sharedLinkValue}?showParentPath=false`;
    // const embeddedUrl = `https://app.box.com/embed/s/${sharedLinkValue}?view=list&sortColumn=date&sortDirection=ASC&showParentPath=true`;
    const $linkNoteButton = $("#link-note-button");
    const $embeddedBoxNote = $("#embedded-box-note");
    $linkNoteButton.click(() => {
      window.open(sharedLink, "_blank");
    });
    $linkNoteButton.show();
    $embeddedBoxNote[0].src = embeddedUrl;
    $embeddedBoxNote.show();
  };

  garoon.events.on("schedule.event.detail.show", event => {
    const eventMenu = event.event.eventMenu;
    const boxSharedUrl = event.event.additionalItems.item.value;

    // 連携対象の予定メニューでなければ処理終了
    if (!targetEvent.includes(eventMenu)) {
      return;
    }

    // boxの連携URLの存在確認
    if (boxSharedUrl === "") {
      showCreateBotton();
    } else {
      showExistedNote(boxSharedUrl);
    }
  });
})(jQuery);
