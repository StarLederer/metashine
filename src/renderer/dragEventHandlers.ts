function cancelDragOverAndEnter(
  event: JQuery.DragEnterEvent | JQuery.DragOverEvent
) {
  event.preventDefault();
  event.stopPropagation();
}

export default cancelDragOverAndEnter;
