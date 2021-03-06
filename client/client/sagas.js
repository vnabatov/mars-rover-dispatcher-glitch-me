import io from 'socket.io-client'
import { eventChannel } from 'redux-saga'
import { fork, take, call, put, cancel, select } from 'redux-saga/effects'

/* global SERVER_HOST, SERVER_PORT */
const serverUrl = `${SERVER_HOST || ''}${(SERVER_PORT && (':' + SERVER_PORT)) || ''}`

function connect () {
  const socket = io(serverUrl, { secure: true, transports: ['websocket'] })
  socket.on('connect', (client) => {
    setInterval(
      () => console.log('transport:', socket.io.engine.transport.name), 5000)
  })
  return socket
}

function subscribe (socket) {
  return eventChannel(emit => {
    const bindToSocket = (event) => {
      socket.on(event, (data) => emit({ type: event, params: data }))
    }

    bindToSocket('connect')
    bindToSocket('reconnected')
    bindToSocket('error')
    bindToSocket('reconnect_error')
    bindToSocket('disconnect')
    bindToSocket('message')
    bindToSocket('msg:broadcasted')
    bindToSocket('welcome')
    bindToSocket('join')
    bindToSocket('memberJoined')

    return () => {
    }
  })
}

function * read (socket) {
  console.log('subscribe')
  const channel = yield call(subscribe, socket)
  while (true) {
    let action = yield take(channel)
    yield put(action)
  }
}

function * camUpdate () {
  while (true) {
    const { value } = yield take('camUpdate')

    const msg = { cmd: 'camera', params: { offset: value } }

    yield put({ type: 'sendMessage', params: msg })
  }
}

function * platformMove () { // fixme copy past from cam update
  while (true) {
    const { value: { x: mx, y: my } } = yield take('platformMove')
    const { x: fx, y: fy } = yield select((state) => state.platform.factor)
    const msg = { cmd: 'direction', params: { offset: { x: mx * fx, y: my * fy } } }

    yield put({ type: 'sendMessage', params: msg })
  }
}

function * platformStepperMove () { // fixme copy past from cam update
  while (true) {
    const { value } = yield take('platformStepperMove')

    const msg = { cmd: 'stepper-platform', params: { offset: value } }

    yield put({ type: 'sendMessage', params: msg })
  }
}

function * videoCall (socket, action) {
  while (true) {
    const { participant } = yield take('requestVideoCall')
    const msg = { cmd: 'makeCall', params: { video: true, participants: participant } }
    yield put({ type: 'sendMessage', params: msg })
  }
}

function * write (socket, action) {
  while (true) {
    const { params } = yield take('sendMessage')
    socket.emit('message', params)
  }
}

function * handleIO (socket) {
  yield fork(camUpdate)
  yield fork(videoCall, socket)
  yield fork(platformMove)
  yield fork(platformStepperMove)
  yield fork(read, socket)
  yield fork(write, socket)
  yield fork(welcomeFlow, socket)
}

function * joinToRoomFlow (socket, { params }) {
  const { name: targetRoomName } = params
  console.log(targetRoomName)
  socket.emit('join', { roomName: targetRoomName })
  const { params: { roomName: joinedRoomName } } = yield take('join')
  console.log('joined', joinedRoomName)
  if (joinedRoomName === targetRoomName) {
    return params
  } else {
    throw new Error(`unexpected room ${joinedRoomName}`)
  }
}

function * welcomeFlow (socket) {
  while (true) {
    const { params: welcomeParams } = yield take('welcome')
    yield put({ type: 'inLobby', params: welcomeParams })
    const { params: joinParams } = yield take('requestJoinRoom')
    console.log('join started')
    yield call(joinToRoomFlow, socket, { params: joinParams })
    console.log('join finished')
    yield put({ type: 'leaveLobby', joinParams })
  }
}

function * flow () {
  while (true) {
    const socket = yield call(connect)
    const task = yield fork(handleIO, socket)
    yield take(`logout`)
    yield cancel(task)
  }
}

export default function * rootSaga () {
  yield fork(flow)
}
