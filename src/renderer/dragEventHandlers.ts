function cancelDragOverAndEnter(
  event: JQuery.DragEnterEvent | JQuery.DragOverEvent
): void {
  event.preventDefault();
  event.stopPropagation();
}

export default cancelDragOverAndEnter;
