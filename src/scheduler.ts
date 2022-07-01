const scheduler = {
  isBatchUpdating: false,
  on() {
    scheduler.isBatchUpdating = true;
  },
  off() {
    scheduler.isBatchUpdating = false;
  },
};

export default scheduler;
