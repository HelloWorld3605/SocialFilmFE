const DELETE_HISTORY_CONFIRM_PREF_KEY = "filmfe.historyDelete.skipConfirm";

export const getSkipHistoryDeleteConfirm = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.localStorage.getItem(DELETE_HISTORY_CONFIRM_PREF_KEY) === "true"
  );
};

export const setSkipHistoryDeleteConfirm = (skip: boolean) => {
  if (typeof window === "undefined") {
    return;
  }

  if (skip) {
    window.localStorage.setItem(DELETE_HISTORY_CONFIRM_PREF_KEY, "true");
    return;
  }

  window.localStorage.removeItem(DELETE_HISTORY_CONFIRM_PREF_KEY);
};
