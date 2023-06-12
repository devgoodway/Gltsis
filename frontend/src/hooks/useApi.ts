/**
 * @file useApi hook
 *
 * database api hook using useDatabase
 *
 * @author seedlessapple <luminousseedlessapple@gmail.com>
 *
 * -------------------------------------------------------
 *
 * IN PRODUCTION
 * - useApi hook
 *
 * -------------------------------------------------------
 *
 * IN MAINTENANCE
 *
 * -------------------------------------------------------
 *
 * IN DEVELOPMENT
 *
 * -------------------------------------------------------
 *
 * DEPRECATED
 *
 * -------------------------------------------------------
 *
 * NOTES
 *
 */

import useDatabase from "hooks/useDatabase";
import _ from "lodash";
export default function useApi() {
  const database = useDatabase();

  /**
   * API FUNCTIONS
   */
  function QUERY_BUILDER(params?: object) {
    let query = "";
    if (params) {
      query = "?";
      for (const [key, value] of Object.entries(params)) {
        query = query.concat(`${key}=${value}&`);
      }
    }
    return query;
  }

  function QUERY_SUB_BUILDER(params: string[] | string) {
    return _.join(params, ",");
  }

  /**
   * Registration Api
   * ##########################################################################
   */

  /**
   * Create Memo
   * @type POST
   * @auth member
   * @returns memos
   */
  async function CMemo(params: {
    rid: string;
    memo: {
      title: string;
      day: string;
      start: string;
      end: string;
      classroom?: string;
      memo?: string;
    };
  }) {
    const result = await database.C({
      location: "memos",
      data: { registration: params.rid, ...params.memo },
    });
    return result;
  }

  /**
   * Update Memo
   * @type PUT
   * @auth member
   * @returns memos
   */
  async function UMemo(params: {
    _id: string;
    rid: string;
    memo: {
      title: string;
      day: string;
      start: string;
      end: string;
      classroom?: string;
      memo?: string;
    };
  }) {
    const result = await database.U({
      location: "memos/" + params._id,
      data: { registration: params.rid, ...params.memo },
    });
    return result;
  }

  /**
   * Delete Memo
   * @type DELETE
   * @auth member
   * @returns memos
   */
  async function DMemo(params: { _id: string; rid: string }) {
    const result = await database.D({
      location:
        "memos/" + params._id + QUERY_BUILDER({ registration: params.rid }),
    });
    return result;
  }

  /**
   * Notification Api
   * ##########################################################################
   */
  async function SendNotifications(props: {
    data: {
      toUserList: any[];
      category: string;
      title: string;
      description: string;
    };
  }) {
    return await database.C({
      location: `notifications`,
      data: props.data,
    });
  }

  async function RNotifications(props: {
    type: "received" | "sent";
    user: string;
    checked?: boolean;
  }) {
    const { notifications: _notifications } = await database.R({
      location: "notifications" + QUERY_BUILDER(props),
    });
    const notifications = _.sortBy(_notifications, "createdAt").reverse();
    return notifications;
  }

  async function RNotificationById(_id: string) {
    return await database.R({
      location: `notifications/${_id}`,
    });
  }
  async function UCheckNotification(_id: string) {
    const res = await database.U({
      location: `notifications/${_id}/check`,
      data: {},
    });
    return res;
  }

  async function DNotifications(_ids: string[]) {
    const _notifications_ids = QUERY_SUB_BUILDER(_ids);
    return await database.D({
      location: "notifications" + QUERY_BUILDER({ _ids: _notifications_ids }),
    });
  }

  return {
    RegistrationApi: {
      CMemo,
      UMemo,
      DMemo,
    },
    NotificationApi: {
      SendNotifications,
      RNotifications,
      RNotificationById,
      UCheckNotification,
      DNotifications,
    },
  };
}
