import { combineReducers } from 'redux';

const proximityReducer = (state = 0, action) => {
  switch (action.type) {
      case 'message':
          if (action.params.cmd=='proximity-data'){
            return state = action.params.result;
          }
        default:
            return state
    }
};

export default combineReducers({ proximity: proximityReducer })
