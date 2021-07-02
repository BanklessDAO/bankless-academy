import React, { useState, useRef } from 'react'
import Link from 'next/link'
import {
  useColorMode,
  Box,
  CircularProgress,
  Center,
  Divider,
  Text,
  Image,
  Button,
  Stack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react'
import styled from '@emotion/styled'
import { QUESTS } from '../constants'

const QuestCard = styled(Box)`
  border-radius: 0.5rem;
`

const PoapImage = styled(Image)`
  position: absolute;
  width: 250px;
`

const Duration = styled(Button)`
  position: absolute;
  top: 12px;
  left: 12px;
`

const Difficulty = styled(Button)`
  position: absolute;
  bottom: 12px;
  left: 12px;
`

const Claimed = styled(Button)`
  position: absolute;
  top: 12px;
  right: 12px;
`

const QuestCards: React.FC = () => {
  const { colorMode } = useColorMode()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const modalRef = useRef(null)
  const [selectedQuest, setselectedQuest] = useState(null)

  return (
    <>
      {QUESTS.map((quest, index) => (
        <QuestCard
          bg={colorMode === 'dark' ? 'whiteAlpha.400' : 'blackAlpha.400'}
          cursor="pointer"
          key={`quest-${index}`}
          onClick={() => {
            setselectedQuest(index)
            onOpen()
          }}
        >
          <Center minH="320px" position="relative">
            <CircularProgress
              value={30}
              size="300px"
              thickness="2px"
              trackColor="#edebe961"
              color="red"
            />
            <PoapImage src={quest.poap_image} />
            <Duration colorScheme="gray" borderRadius="full" size="xs">
              🕒 {quest.duration} min
            </Duration>
            <Difficulty colorScheme="gray" borderRadius="full" size="xs">
              {quest.difficulty}
            </Difficulty>
            <Claimed colorScheme="gray" borderRadius="full" size="xs">
              🎖 12 Claimed
            </Claimed>
          </Center>
          <Divider />
          <Stack minH="100px" p="4">
            <Text fontSize="2xl" fontWeight="bold">
              {quest.name}
            </Text>
            <Text fontSize="xl">{quest.description}</Text>
          </Stack>
        </QuestCard>
      ))}
      <Modal
        finalFocusRef={modalRef}
        isOpen={isOpen}
        onClose={onClose}
        isCentered
      >
        <ModalOverlay />
        {selectedQuest !== null && (
          <ModalContent>
            <ModalHeader>{QUESTS[selectedQuest].name}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>
                📚 Knowledge requirement? No prior knowledge needed. 📖 What
                will you learn from this? Understand ... 🤓 What will you be
                able to do by the end of this course? create and manage your own
                wallet connect your wallet to Onboard
              </Text>
              <Link href={`/quest/${QUESTS[selectedQuest].slug}`}>
                <Button>Start now</Button>
              </Link>
            </ModalBody>
          </ModalContent>
        )}
      </Modal>
    </>
  )
}

export default QuestCards