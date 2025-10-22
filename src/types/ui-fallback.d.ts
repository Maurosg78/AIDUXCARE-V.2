declare module '*.tsx' {
  export = React.ComponentType<any>;
}
declare module '*.ts' {
  const content: any;
  export default content;
}
