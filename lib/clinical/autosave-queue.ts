export class ClinicalAutosaveQueue {
  private tail: Promise<void> = Promise.resolve();

  enqueue(task: () => Promise<void>) {
    const run = this.tail.catch(() => undefined).then(task);
    this.tail = run;
    return run;
  }
}
