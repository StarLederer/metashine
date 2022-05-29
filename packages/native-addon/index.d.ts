declare module "native-addon" {
  function loadTag(): any;
  function updateTag(): void;
  export { loadTag, updateTag };
}
