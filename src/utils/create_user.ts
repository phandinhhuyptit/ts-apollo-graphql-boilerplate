import { encryptPassword } from './auth'
export const up = async user => {
  const existUser = await user.find({ username: 'admin', role: 1 })
  if (existUser && existUser.length > 0) {
    return null
  }
  const input = {
    fullname: 'Admin',
    username: 'admin',
    password: '123456',
    email: 'dev@kompa.ai',
    role: 1,
    status: 2,
  }
  input.password = await encryptPassword(input.password)
  return user
    .create(input)
    .then(item => {
      console.log('Create admin successful!')
    })
    .catch(err => {
      console.error(err)
    })
}
