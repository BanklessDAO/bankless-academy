import React, { useRef, useState, useEffect } from 'react'
import {
  Box,
  Text,
  Image as ChakraImage,
  ButtonGroup,
  Button,
  HStack,
  VStack,
  SimpleGrid,
  useToast,
  Tooltip,
  Link,
} from '@chakra-ui/react'
import NextLink from 'next/link'
import axios from 'axios'
import { useHotkeys } from 'react-hotkeys-hook'
import styled from '@emotion/styled'
import { useRouter } from 'next/router'
import ReactHtmlParser, { convertNodeToElement } from 'react-html-parser'
import { useMediaQuery } from '@chakra-ui/react'
import { ArrowBackIcon, ArrowForwardIcon } from '@chakra-ui/icons'
import { Warning, Checks } from 'phosphor-react'
// import { isMobile } from 'react-device-detect'

import { LessonType, SlideType } from 'entities/lesson'
import ProgressSteps from 'components/ProgressSteps'
import Card from 'components/Card'
import MintKudos from 'components/MintKudos'
import QuestComponent from 'components/Quest/QuestComponent'
import { useActiveWeb3React } from 'hooks'
import { track, verifySignature, getSignature } from 'utils'
import { GENERIC_ERROR_MESSAGE, IS_WHITELABEL } from 'constants/index'
import { LearnIcon, QuizIcon, QuestIcon, PoapIcon } from 'components/Icons'

// transform keywords into Tooltip
function transform(node, index) {
  if (node.type === 'tag' && node.name === 'a') {
    // force links to target _blank
    node.attribs.target = '_blank'
  }
  if (node.type === 'tag' && node.name === 'span') {
    // add Tooltip with definition
    return (
      <Tooltip hasArrow label={node.attribs.definition}>
        {convertNodeToElement(node, index, transform)}
      </Tooltip>
    )
  }
}

const Slide = styled(Card)<{ issmallscreen?: string; slidetype: SlideType }>`
  border-radius: 0.5rem;
  ${(props) => props.issmallscreen === 'true' && 'display: contents;'};
  h1 {
    margin-top: 1em;
    font-size: var(--chakra-fontSizes-2xl);
  }
  span.tooltip {
    cursor: help;
    border-bottom: 1px dashed grey;
  }
  div.content > div {
    ${(props) =>
      props.slidetype === 'LEARN' &&
      (props.issmallscreen === 'true' ? 'display: block;' : 'display: flex;')};
  }
  div.content > div > img {
    margin: auto;
    ${(props) => props.issmallscreen !== 'true' && 'max-height: 60vh;'};
  }
  .bloc-ab {
    flex: 1 1 0;
    margin: 10px;
  }
  .bloc-ab img {
    width: 100%;
  }
  .bloc-b {
    ${(props) =>
      props.issmallscreen === 'true' && 'border-bottom: 1px solid #72757B;'};
  }
  div.content > div > div:last-child .bloc-b {
    border-bottom: none;
  }
  .bloc1,
  .bloc2 {
    flex: 1;
  }
  .bloc2 {
    align-self: center;
    img {
      width: auto;
      margin: auto;
      max-height: 100%;
    }
    ${(props) =>
      props.issmallscreen === 'true'
        ? `
        margin-top: 24px;
        img {
          width: 100%;
        }
      `
        : 'img {  max-height: 60vh; }'};
  }
  div.content div {
    h2,
    p {
      font-size: var(--chakra-fontSizes-xl);
      margin: 1em;
    }
    h2 {
      font-weight: bold;
    }
    a {
      color: #b85ff1;
      text-decoration: none;
    }
    ul,
    ol {
      font-size: var(--chakra-fontSizes-xl);
      margin-left: 2em;
    }
    iframe {
      margin: 20px auto 0;
      width: 640px;
      max-width: 100%;
      height: 360px;
    }
  }
`

const Answers = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  span {
    color: black;
    margin-right: 0.5em;
    margin-bottom: 4px;
  }
`

export type AnswerStateType = 'UNSELECTED' | 'CORRECT' | 'WRONG'

const QuizAnswer = styled(Button)<{
  answerState: AnswerStateType
  isActive: boolean
}>`
  ${(props) => props.isActive && 'cursor: default;'};
  ${(props) =>
    props.answerState === 'UNSELECTED' &&
    props.isActive &&
    'background: #1C1C1C !important;'}
  ${(props) =>
    props.answerState === 'CORRECT' &&
    'background: linear-gradient(95.83deg, #44A991 -9.2%, rgba(68, 169, 145, 0.7) 97.91%) !important;'}
  ${(props) =>
    props.answerState === 'WRONG' &&
    'background: linear-gradient(91.91deg, #A94462 49%, rgba(169, 68, 98, 0.7) 124.09%) !important;'}
`

const SlideNav = styled(Box)<{ issmallscreen?: string }>`
  ${(props) =>
    props.issmallscreen === 'true' &&
    `
      position: fixed;
      bottom: 0;
      width: 100%;
      left: 0;
      background-color: black;
      z-index: 10;
      border-top:1px solid #222222;
      `};
`

const Lesson = ({ lesson }: { lesson: LessonType }): React.ReactElement => {
  // HACK: fix bug when someone has already claimed the POAP
  if (localStorage.getItem(`poap-${lesson.slug}`) === 'true')
    localStorage.removeItem(`poap-${lesson.slug}`)
  const numberOfSlides = lesson.slides.length
  // HACK: when reducing the number of slides in a lesson
  if (
    parseInt(localStorage.getItem(lesson.slug) || '0') + 1 >=
    numberOfSlides
  ) {
    localStorage.setItem(lesson.slug, (numberOfSlides - 1).toString())
  }

  const buttonLeftRef = useRef(null)
  const buttonRightRef = useRef(null)
  const answerRef = useRef([])
  const [currentSlide, setCurrentSlide] = useState(
    parseInt(localStorage.getItem(lesson.slug) || '0')
  )
  const [selectedAnswerNumber, setSelectedAnswerNumber] = useState<number>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isClaimingPoap, setIsClaimingPoap] = useState(false)
  const [isPoapMinted, setIsPoapMinted] = useState(false)
  const [poapData, setPoapData] = useState<{ code?: string; error?: string }>(
    {}
  )
  const [isPoapClaimed, setIsPoapClaimed] = useState(
    !!localStorage.getItem(`poap-${lesson.slug}`)
  )
  const [isSmallScreen] = useMediaQuery('(max-width: 800px)')

  const router = useRouter()
  const toast = useToast()
  const slide = lesson.slides[currentSlide]
  const isFirstSlide = currentSlide === 0
  const isLastSlide = currentSlide + 1 === numberOfSlides

  const { library, account } = useActiveWeb3React()
  const walletAddress = account
  // DEV ENV: you can force a specific wallet address here if you want to test the claiming function
  // walletAddress = '0xbd19a3f0a9cace18513a1e2863d648d13975cb44'

  useEffect((): void => {
    localStorage.setItem(lesson.slug, currentSlide.toString())
  }, [currentSlide])

  useEffect(() => {
    // preloading all lesson images after 3 seconds for smoother transitions
    setTimeout(() => {
      lesson.imageLinks.forEach((imageLink) => {
        const img = new Image()
        img.src = imageLink
      })
    }, 3000)
  }, [])

  const goToPrevSlide = () => {
    if (!isFirstSlide) {
      setPoapData({})
      setCurrentSlide(currentSlide - 1)
    }
    setSelectedAnswerNumber(null)
  }

  const goToNextSlide = () => {
    if (slide.quiz && localStorage.getItem(`quiz-${slide.quiz.id}`) === null) {
      alert('select your answer to the quiz first')
    } else if (!isLastSlide) {
      setCurrentSlide(currentSlide + 1)
      // TEMP: don't block last slide
      // } else if (isLastSlide && isPoapClaimed) {
    } else if (isLastSlide) {
      if (lesson.endOfLessonRedirect) {
        if (lesson.endOfLessonRedirect.includes('https://tally.so/r/')) {
          // redirect to embeded Tally form
          const tallyId = lesson.endOfLessonRedirect.replace(
            'https://tally.so/r/',
            ''
          )
          router.push(`/feedback?tally=${tallyId}`)
        } else {
          // generic redirect
          document.location.href = lesson.endOfLessonRedirect
        }
      } else {
        // defaut: go back to lessons
        router.push('/lessons')
      }
    }
    setSelectedAnswerNumber(null)
  }

  const selectAnswer = (e, answerNumber: number) => {
    if (slide.type !== 'QUIZ') return
    if (!answerIsCorrect) setSelectedAnswerNumber(answerNumber)
    if (slide.quiz.rightAnswerNumber === answerNumber) {
      track('quiz_answer', {
        id: slide.quiz.id,
        isRightAnswer: true,
        selectedAnswerNumber: answerNumber,
      })
      // correct answer
      localStorage.setItem(`quiz-${slide.quiz.id}`, answerNumber.toString())
    } else if (!answerIsCorrect) {
      track('quiz_answer', {
        id: slide.quiz.id,
        isRightAnswer: false,
        selectedAnswerNumber: answerNumber,
      })
      // wrong answer
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const signMessage = async () => {
    const message = Date.now().toString()

    try {
      const signature = await getSignature(library, account, message)
      const verified = verifySignature(account, signature, message)
      if (verified) {
        claimPoap(message, signature)
      } else {
        alert('wrong signature')
      }
    } catch (error) {
      console.error(error)
    }
  }

  const claimPoap = (message: string, signature: string) => {
    setIsClaimingPoap(true)
    axios
      .get(
        `/api/claim-poap?address=${walletAddress}&poapEventId=${lesson.poapEventId}&signature=${signature}&message=${message}`
      )
      .then(function (res) {
        // eslint-disable-next-line no-console
        console.log(res.data)
        setIsClaimingPoap(false)
        setPoapData(
          (res.data?.code && typeof res.data?.code === 'string') ||
            (res.data?.error && typeof res.data?.error === 'string')
            ? res.data
            : {
                error: GENERIC_ERROR_MESSAGE,
              }
        )
        if (res.data?.code) {
          setIsPoapClaimed(true)
          localStorage.setItem(`poap-${lesson.slug}`, res.data.code)
        }
      })
      .catch(function (error) {
        console.error(error)
        toast({
          title: 'Something went wrong',
          description: 'Refresh and try again ...',
          // TODO: claim code manually + improve error handling
          status: 'error',
          duration: 5000,
        })
      })
  }

  // shortcuts
  // TODO: add modal with all the shortcuts
  useHotkeys('?,shift+/', () =>
    alert(
      'TODO: add a modal with all the shortcuts 👉 previous slide ⬅️ | next slide ➡️ | select quiz answer 1️⃣ / 2️⃣ / 3️⃣ / 4️⃣'
    )
  )
  useHotkeys('left', () => {
    buttonLeftRef?.current?.click()
  })
  useHotkeys('right', () => {
    buttonRightRef?.current?.click()
  })
  useHotkeys('1', () => {
    answerRef?.current[1]?.click()
  })
  useHotkeys('2', () => {
    answerRef?.current[2]?.click()
  })
  useHotkeys('3', () => {
    answerRef?.current[3]?.click()
  })
  useHotkeys('4', () => {
    answerRef?.current[4]?.click()
  })

  const answerIsCorrect =
    slide?.quiz &&
    parseInt(localStorage.getItem(`quiz-${slide.quiz.id}`)) ===
      slide.quiz.rightAnswerNumber

  const Quest = QuestComponent(lesson.quest)
  // TODO: store quest verification state in local storage

  const poapCode = localStorage.getItem(`poap-${lesson.slug}`) || poapData.code

  // const hostname = window?.location.hostname

  return (
    <Slide
      p={8}
      pt={4}
      pb={2}
      mt={6}
      issmallscreen={isSmallScreen.toString()}
      key={`slide-${currentSlide}`}
      slidetype={slide.type}
    >
      {/* {isMobile && currentSlide === 0 && (
        <Box py={4}>
          ⛔️ on mobile, make sure to open this website directly inside&nbsp;
          <Link href={`https://metamask.app.link/dapp/${hostname}`} color="red">
            MetaMask&apos;s browser
          </Link>
        </Box>
      )} */}
      <Text
        fontSize={isSmallScreen ? 'xl' : '3xl'}
        my={isSmallScreen ? '2' : '4'}
        display="inline-flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
        fontWeight="bold"
        as="h2"
      >
        <Box display="inline-flex" alignItems="center" mr="4">
          {slide.type === 'LEARN' && <LearnIcon />}
          {slide.type === 'QUIZ' && <QuizIcon />}
          {slide.type === 'QUEST' && <QuestIcon />}
          {slide.type === 'POAP' && <PoapIcon />}
          {slide.type === 'END' && <PoapIcon />}
        </Box>
        <Box>
          {slide.type === 'QUIZ' ? (
            <>Knowledge Check</>
          ) : (
            <>{ReactHtmlParser(slide.title, { transform })}</>
          )}
        </Box>
      </Text>
      <ProgressSteps step={currentSlide} total={numberOfSlides} />
      <Box maxH={isSmallScreen ? 'unset' : '600px'}>
        <Box
          className="content"
          minH="calc(100vh - 360px)"
          pb={isSmallScreen ? '6' : 0}
          pt={4}
        >
          {slide.type === 'LEARN' && (
            <Box>{ReactHtmlParser(slide.content, { transform })}</Box>
          )}
          {slide.type === 'QUIZ' && (
            <>
              {slide.quiz?.question && (
                <Box>
                  <h2>
                    {ReactHtmlParser(slide?.quiz?.question, { transform })}
                  </h2>
                </Box>
              )}
              <Answers mt={4}>
                <ButtonGroup size="lg" w="100%">
                  <SimpleGrid
                    columns={[null, null, 1]}
                    spacing="40px"
                    w="100%"
                    justifyItems="center"
                  >
                    {[1, 2, 3, 4].map((n) => {
                      const answerState = answerIsCorrect
                        ? slide.quiz.rightAnswerNumber === n
                          ? 'CORRECT'
                          : 'UNSELECTED'
                        : selectedAnswerNumber === n
                        ? 'WRONG'
                        : 'UNSELECTED'
                      if (slide.quiz.answers.length >= n)
                        return (
                          <QuizAnswer
                            ref={(el) => (answerRef.current[n] = el)}
                            key={`answer-${n}`}
                            w="100%"
                            maxW="500px"
                            p="4"
                            h="auto"
                            border={
                              answerState === 'UNSELECTED' &&
                              '1px solid #646587'
                            }
                            whiteSpace="break-spaces"
                            onClick={(e) => selectAnswer(e, n)}
                            answerState={answerState}
                            justifyContent="space-between"
                            textAlign="left"
                            rightIcon={
                              answerState === 'CORRECT' ? (
                                <Checks weight="bold" color="white" />
                              ) : (
                                answerState === 'WRONG' && (
                                  <Warning weight="bold" color="white" />
                                )
                              )
                            }
                            isActive={answerIsCorrect}
                          >
                            {slide.quiz.answers[n - 1]}
                          </QuizAnswer>
                        )
                    })}
                  </SimpleGrid>
                </ButtonGroup>
              </Answers>
            </>
          )}
          {slide.type === 'QUEST' && (
            <VStack flex="auto" minH="420px" justifyContent="center">
              {Quest?.questComponent}
            </VStack>
          )}
          {slide.type === 'POAP' && (
            <VStack flex="auto" minH="420px" justifyContent="center">
              {walletAddress ? (
                <>
                  <ChakraImage
                    src={lesson.poapImageLink}
                    height="250px"
                    opacity={isPoapClaimed ? 1 : 0.7}
                    mb="2"
                  />
                  {poapData.error ? (
                    <Button
                      variant="outline"
                      whiteSpace="break-spaces"
                      color="red.200"
                      mt="4"
                      leftIcon={<Warning />}
                    >
                      {poapData.error}
                    </Button>
                  ) : (
                    <>
                      {!isPoapClaimed ? (
                        // <Button
                        //   variant="primary"
                        //   color="white"
                        //   onClick={signMessage}
                        //   isLoading={isClaimingPoap}
                        // >
                        //   Claim POAP
                        // </Button>
                        // TEMP: no POAP message
                        <Box textAlign="center">
                          {
                            'POAP distribution has been disabled due to farmers 👨‍🌾. We are currently working on an alternative.'
                          }
                          <br />
                          {
                            'Feel free to explore other lessons in the meantime. Thank you for your patience. 🙏'
                          }
                          <br />
                          {'Follow this '}
                          <Link
                            href={`https://twitter.com/BanklessAcademy/status/1497225246167941124`}
                            target="_blank"
                          >
                            tweet
                          </Link>
                          {' 👀 to stay up to date.'}
                        </Box>
                      ) : (
                        <>
                          <h2>
                            {`Congrats on finishing our "${lesson.name}" lesson! 🥳`}
                          </h2>
                          {poapCode && (
                            <>
                              {isPoapMinted &&
                              lesson.slug === 'intro-to-defi' ? (
                                <>
                                  <Button
                                    mt="4"
                                    onClick={() => router.push('/feedback')}
                                  >
                                    Feedback form
                                  </Button>
                                </>
                              ) : isPoapMinted ? null : (
                                <Box display="flex" mt="4" alignItems="center">
                                  <Link
                                    href={`https://app.poap.xyz/claim/${poapCode}?address=${walletAddress}`}
                                    target="_blank"
                                    onClick={() => setIsPoapMinted(true)}
                                    mr="4"
                                  >
                                    <Button variant="primary" color="white">
                                      Mint POAP
                                    </Button>
                                  </Link>
                                  <span>
                                    👈 don&apos;t forget to mint your POAP!
                                  </span>
                                </Box>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}
                </>
              ) : (
                <h2>
                  ⚠️ Connect your wallet first (&quot;Connect wallet&quot;
                  button in the top-right corner)
                </h2>
              )}
              {/* TEMP: hide POAP help */}
              {isPoapClaimed && (
                <h2>
                  {'🙋‍♂️ Having trouble claiming/minting your POAP? Check out '}
                  <Link
                    target="_blank"
                    rel="noreferrer"
                    href="https://bankless.notion.site/Bankless-Academy-POAP-support-9a9e60c883ac427da14dad324731028c"
                  >
                    this guide
                  </Link>
                </h2>
              )}
            </VStack>
          )}
          {slide.type === 'END' && (
            <VStack flex="auto" minH="420px" justifyContent="center">
              {IS_WHITELABEL && !walletAddress ? (
                <>{Quest?.questComponent}</>
              ) : (
                <>
                  {lesson.poapImageLink && (
                    <ChakraImage
                      src={lesson.poapImageLink}
                      height="250px"
                      mb="2"
                    />
                  )}
                  <h2>{`Congrats on finishing our "${lesson.name}" lesson! 🥳`}</h2>
                  <MintKudos />
                  <p>{lesson.endOfLessonText && lesson.endOfLessonText}</p>
                  <NextLink href={`/lessons`}>
                    <Button
                      variant="primary"
                      size="lg"
                      style={{ padding: '0 23px' }}
                    >
                      Explore more Lessons
                    </Button>
                  </NextLink>
                </>
              )}
            </VStack>
          )}
        </Box>
      </Box>
      <SlideNav display="flex" p={4} issmallscreen={isSmallScreen.toString()}>
        <HStack flex="auto">
          {!isFirstSlide && (
            <Button
              ref={buttonLeftRef}
              variant="secondaryBig"
              size="lg"
              onClick={goToPrevSlide}
              leftIcon={<ArrowBackIcon />}
            >
              Prev
            </Button>
          )}
          {lesson.isCommentsEnabled && !isSmallScreen && slide.notionId && (
            <Tooltip
              hasArrow
              label="Help us improve the content by commenting this slide on Notion"
            >
              <Link
                target="_blank"
                rel="noreferrer"
                href={`https://www.notion.so/${lesson.notionId}#${slide.notionId}`}
              >
                <Button variant="outline">🐞 comment this slide</Button>
              </Link>
            </Tooltip>
          )}
        </HStack>
        <HStack>
          {(!isLastSlide || lesson.endOfLessonText) && (
            <Button
              ref={buttonRightRef}
              variant={isLastSlide ? 'primaryBigLast' : 'primaryBig'}
              size="lg"
              disabled={
                // TEMP: don't block last slide
                // (isLastSlide && !isPoapClaimed) ||
                (slide.quiz && !answerIsCorrect) ||
                (slide.type === 'QUEST' && !Quest?.isQuestCompleted)
              }
              onClick={goToNextSlide}
              rightIcon={<ArrowForwardIcon />}
            >
              Next
            </Button>
          )}
        </HStack>
      </SlideNav>
    </Slide>
  )
}

export default Lesson
