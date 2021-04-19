export interface IContextMenuOption {
    name: string,
    click(event: JQuery.MouseUpEvent): void,
}