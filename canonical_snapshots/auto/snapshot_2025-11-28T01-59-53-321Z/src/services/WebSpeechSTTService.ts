export class WebSpeechSTTService {
  onSegment(_: (segment:any)=>void){/* noop */}
  onError(_: (err:any)=>void){/* noop */}
  onStatus(_: (status:any)=>void){/* noop */}
  async start(){/* noop */}
  async stop(){/* noop */}
  static getBrowserCompatibility(){ return { webSpeechApi: true, browserName: 'Generic', isSupported: true, recommendedAction: undefined as undefined | string }; }
}
const instance = new WebSpeechSTTService();
export default instance;
