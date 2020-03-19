import { User } from './user'

export const createStore = () => {
  return {
    user: new User().model,
  }
}
