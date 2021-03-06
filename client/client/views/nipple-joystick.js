import { connect } from 'react-redux'
import { PureComponent } from 'react'
import nipplejs from 'nipplejs'
import { directAngleToPosition } from './utils'

class NippleJoystik extends PureComponent {
  componentDidMount () {
    const { onChange } = this.props

    const options = {
      zone: this.joystick,
      mode: 'static',
      color: 'cyan',
      position: { left: '50%', top: '50%' }
    }

    const manager = nipplejs.create(options)

    manager.on('start end', function (evt, data) {
      onChange({ x: 0, y: 0 })
    }).on('move', function (evt, data) {
      let { direction } = data

      let values
      if (direction) {
        values = directAngleToPosition(direction.angle)
      }

      onChange(values)
    }).on('dir:up plain:up dir:left plain:left dir:down ' +
        'plain:down dir:right plain:right',
    function (evt, data) {
      onChange({ x: 0, y: 0 })
    }
    ).on('pressure', function (evt, data) {
      // not used
    })
  }

  render () {
    return <div>
      <span>Touch Platform Joystick</span>
      <div className='nipple-joystick-container'>
        <div ref={(node) => (this.joystick = node)} id='nipple-joystick' />
      </div>
    </div>
  }
};

const connectToPlatform = connect(
  ({ platform: { offset } }) => ({ x: offset.x, y: offset.y }),
  (dispatch) => ({ onChange: ({ x, y }) => dispatch({ type: 'platformMove', value: { x, y } }) }))

export default connectToPlatform(NippleJoystik)
