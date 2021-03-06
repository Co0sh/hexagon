import { Application, Text } from 'pixi.js';

interface Measurement {
  timestamp: number;
  fps: number;
}

export default class FpsCounter {
  private readonly text: Text;
  private sample: Measurement[] = [];

  public constructor(
    private app: Application,
    private sampleTime: number = 1000
  ) {
    this.text = new Text('60', { stroke: 0xffffff, strokeThickness: 5 });
    app.stage.addChild(this.text);
    app.ticker.add(this.handleTick);
  }

  public stop = (): void => {
    this.app.ticker.remove(this.handleTick);
  };

  private handleTick = () => {
    const measurement = {
      timestamp: new Date().getTime(),
      fps: this.app.ticker.FPS,
    };
    const now = new Date().getTime();
    this.sample = [
      measurement,
      ...this.sample.filter(m => now - m.timestamp < this.sampleTime),
    ];
    this.text.text = String(
      Math.round(
        this.sample.reduce((prev, curr) => prev + curr.fps, 0) /
          this.sample.length
      )
    );
  };
}
