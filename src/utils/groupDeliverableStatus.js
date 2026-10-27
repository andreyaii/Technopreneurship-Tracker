export const GROUP_DELIVERABLE_STATUS = {
  SUBMITTED: "Submitted",
  IN_PROGRESS: "In Progress",
  NOT_AVAILABLE: "Not Available",
};

export function getGroupDeliverableStatus(item) {
  if (
    item.status === GROUP_DELIVERABLE_STATUS.SUBMITTED ||
    item.isSubmitted === true
  ) {
    return GROUP_DELIVERABLE_STATUS.SUBMITTED;
  }

  if (item.status === GROUP_DELIVERABLE_STATUS.IN_PROGRESS) {
    return GROUP_DELIVERABLE_STATUS.IN_PROGRESS;
  }

  if (item.status === GROUP_DELIVERABLE_STATUS.NOT_AVAILABLE) {
    return GROUP_DELIVERABLE_STATUS.NOT_AVAILABLE;
  }

  const submittedCount = Number(item.submittedCount) || 0;
  const totalMembers = Number(item.totalMembers) || 0;

  if (totalMembers > 0 && submittedCount >= totalMembers) {
    return GROUP_DELIVERABLE_STATUS.SUBMITTED;
  }
  if (submittedCount > 0) {
    return GROUP_DELIVERABLE_STATUS.IN_PROGRESS;
  }
  return GROUP_DELIVERABLE_STATUS.NOT_AVAILABLE;
}

export function filterGroupDeliverables(deliverables, status = "all") {
  if (status === "all") return deliverables;
  const statusByFilter = {
    submitted: GROUP_DELIVERABLE_STATUS.SUBMITTED,
    inProgress: GROUP_DELIVERABLE_STATUS.IN_PROGRESS,
    notAvailable: GROUP_DELIVERABLE_STATUS.NOT_AVAILABLE,
  };
  const filteredStatus = statusByFilter[status] ?? status;
  return deliverables.filter(
    (item) => getGroupDeliverableStatus(item) === filteredStatus
  );
}

export function getGroupDeliverableStatusCounts(deliverables) {
  return deliverables.reduce(
    (counts, item) => {
      const status = getGroupDeliverableStatus(item);
      if (status === GROUP_DELIVERABLE_STATUS.SUBMITTED) {
        counts.submitted += 1;
      } else if (status === GROUP_DELIVERABLE_STATUS.IN_PROGRESS) {
        counts.inProgress += 1;
      } else {
        counts.notAvailable += 1;
      }
      return counts;
    },
    { submitted: 0, inProgress: 0, notAvailable: 0 }
  );
}
