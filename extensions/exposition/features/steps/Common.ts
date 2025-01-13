import { binding, given } from 'cucumber-tsflow'
import { timeout } from '@toa.io/generic'

@binding()
export class Common {
  @given('after {float} second(s)')
  public async timeout (interval: number): Promise<void> {
    await timeout(interval * 1000)
  }

  @given('the process is running')
  public async noop (): Promise<void> {
  }
}
