// We import our the scripts for the smart contract instantiation, and web3
import crowdfundingInstance from '../contracts/crowdfunding'
import crowdfundingProject from '../contracts/project'
import crowdfundingTokenSTP from '../contracts/tokenSTP'

import web3 from '../contracts/web3'
import moment from 'moment'

import { projectsConfig } from '../config'
import { handleError } from '../helpers'
moment.locale('es')

window.REALFUND = window.REALFUND || {}

const DAY = 3600 * 24

export const getProjectsDetails = async projectAddress => {
  console.log(projectAddress)
  const projectInstance = crowdfundingProject(projectAddress)
  console.log(projectInstance)

  const title = await projectInstance.methods
    .title()
    .call()
    .catch(handleError('title()'))

  const creator = await projectInstance.methods
    .creator()
    .call()
    .catch(handleError('creator()'))

  const description = await projectInstance.methods
    .description()
    .call()
    .catch(handleError('description()'))

  const goal = await projectInstance.methods
    .goal()
    .call()
    .catch(handleError('goal()'))

  const finishesAt = await projectInstance.methods
    .finishesAt()
    .call()
    .catch(handleError('finishesAt()'))

  const closedAt = await projectInstance.methods
    .closedAt()
    .call()
    .catch(handleError('closedAt()'))
  // const openedAt = await projectInstance.methods.openedAt().call()

  const contributors = await projectInstance.methods
    .getContributors()
    .call()
    .catch(handleError('getContributors()'))

  const currentUserContribution = await projectInstance.methods
    .contributions(window.REALFUND.thisAccount)
    .call()
    .catch(handleError('currentUserContribution'))

  const currentUserTokensContribution = await projectInstance.methods
    .tokensDistribution(window.REALFUND.thisAccount)
    .call()
    .catch(handleError('currentUserTokensContribution'))

  const currentUserContributionInEhter = web3.utils.fromWei(
    currentUserContribution.toString()
  )
  const goalInEther = web3.utils.fromWei(goal.toString())
  const finishesAtTimestamp = finishesAt.toString()
  const closedAtTimestamp = closedAt.toString()
  // const openedAtTimestamp = openedAt.toString()

  const balance = await web3.eth.getBalance(projectAddress)
  let balanceInEther = web3.utils.fromWei(balance.toString())

  const balanceTokens = await crowdfundingTokenSTP.methods
    .balanceOf(window.REALFUND.thisAccount)
    .call()
    .catch(handleError('crowdfundingTokenSTP.methods.balanceOf'))

  const finalizesIn = moment.unix(finishesAtTimestamp).fromNow()
  const closedAgo = moment.unix(closedAtTimestamp).fromNow()
  // const openedAtMoment = moment.unix(openedAtTimestamp).fromNow()

  const isClosed = closedAtTimestamp === '0' ? false : moment.unix(closedAtTimestamp).isBefore(+new Date())
  // console.log({
  //   // openedAtTimestamp,
  //   closedAtTimestamp,
  //   closedAgo,
  //   // openedAtMoment,
  //   isClosed
  // })

  const percent = isClosed ? 100 : Math.round((balanceInEther * 100) / goalInEther)

  if (isClosed) {
    balanceInEther = goalInEther
  }

  // const projectsAddresses = await crowdfundingInstance.methods
  //   .getProjects()
  //   .call()

  // console.log({ projectsAddresses })

  // const contributors = await projectInstance.methods.getContributors().call()
  // console.log({ contributors })

  const configPerPropject = projectsConfig[projectAddress] || {}
  if (!configPerPropject.image) {
    configPerPropject.image = '/images/ex/th-292x204-1.jpg'
  }

  console.log({
    address: projectAddress,
    title,
    description,
    goal: goalInEther,
    finishesAt: finishesAtTimestamp,
    closedAt: closedAtTimestamp,
    balanceInEther,
    finalizesIn,
    closedAgo,
    isClosed,
    percent,
    creator,
    contributors,
    balanceTokens: balanceTokens.toString(),
    currentUserContributionInEhter,
    currentUserTokensContribution: currentUserTokensContribution.toString(),
    ...configPerPropject
  })

  return {
    address: projectAddress,
    title,
    description,
    goal: goalInEther,
    finishesAt: finishesAtTimestamp,
    closedAt: closedAtTimestamp,
    balanceInEther,
    finalizesIn,
    closedAgo,
    isClosed,
    percent,
    creator,
    balanceTokens: balanceTokens.toString(),
    currentUserContributionInEhter,
    contributors: contributors || [],
    currentUserTokensContribution: currentUserTokensContribution.toString(),
    ...configPerPropject
  }
}

export const getProjectsListInfo = async () => {
  const projectsAddresses = await crowdfundingInstance.methods
    .getProjects()
    .call()

  return Promise.all(projectsAddresses.map(getProjectsDetails))
}

export const startProject = async ({
  title,
  description,
  duration,
  amountGoal
}) => {
  console.log('startProject')
  console.log({
    title,
    description,
    duration,
    amountGoal,
    address: window.REALFUND.thisAccount
  })
  const durationInSeconds = duration * DAY
  const newProject = await crowdfundingInstance.methods
    .startProject(
      title,
      description,
      durationInSeconds,
      web3.utils.toWei(amountGoal, 'ether')
    )
    .send({
      from: window.REALFUND.thisAccount
    })

  const projectInfo = newProject.events.ProjectStarted.returnValues
  console.log({ newProject, projectInfo })
}

export const getRefundProject = async ({ projectAddress }) => {
  const projectInstance = crowdfundingProject(projectAddress)
  console.log(window.REALFUND.thisAccount)
  const responseRefund = await projectInstance.methods.getRefund().send({
    from: window.REALFUND.thisAccount
  })

  console.log(responseRefund)
}

export const getTokensProject = async ({ projectAddress }) => {
  const projectInstance = crowdfundingProject(projectAddress)
  console.log(window.REALFUND.thisAccount)
  const responseRefund = await projectInstance.methods
    .getTokens()
    .send({
      from: window.REALFUND.thisAccount
    })
    .catch(handleError('projectInstance.methods.getTokens'))
  console.log(responseRefund)
}

export const withdrawFundsProject = async ({ projectAddress }) => {
  const projectInstance = crowdfundingProject(projectAddress)
  console.log(window.REALFUND.thisAccount)
  const responseRefund = await projectInstance.methods.withdrawFunds().send({
    from: window.REALFUND.thisAccount
  })

  console.log(responseRefund)
}

export const fundProject = async ({ projectAddress, amount }) => {
  console.log({ projectAddress, amount })
  const projectInstance = crowdfundingProject(projectAddress)
  console.log(projectInstance.methods)
  console.log(window.REALFUND.thisAccount)
  const responseContribution = await projectInstance.methods.contribute().send({
    from: window.REALFUND.thisAccount,
    value: web3.utils.toWei(amount, 'ether')
  })

  console.log(responseContribution)

  // const newTotal = parseInt(
  //   responseContribution.events.FundingReceived.returnValues.currentTotal,
  //   10
  // )
  // const projectGoal = parseInt(this.projectData[index].goalAmount, 10)
  // this.projectData[index].currentAmount = newTotal
  // this.projectData[index].isLoading = false
  // // Set project state to success
  // if (newTotal >= projectGoal) {
  //   this.projectData[index].currentState = 2
  // }
}
