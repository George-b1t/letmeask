import { FormEvent, useEffect, useState } from "react";
import { useParams } from 'react-router-dom';

import { database } from '../services/firebase';

import logoImg from '../assets/images/logo.svg';

import { useAuth } from "../hooks/useAuth";

import { Button } from '../components/Button';
import { RoomCode } from '../components/RoomCode';

import '../styles/room.scss';

// A tipagem Record é a mesma coisa que um objeto
type FirebaseQuestions = Record<string, {
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  isAnswered: boolean;
  isHighlighted: boolean;
}>

type Question = {
  id: string;
  content: string;
  author: {
    name: string;
    avatar: string;
  };
  isHighlighted: boolean;
  isAnswered: boolean;
};

type RoomParams = {
  id: string;
};

function Room() {
  const { user } = useAuth();
  const params = useParams<RoomParams>();
  const [ newQuestion, setNewQuestion ] = useState<string>('');
  const [ questions, setQuestions ] = useState<Question[]>([]);
  const [ title, setTitle ] = useState<string>('');

  const roomId = params.id;

  useEffect(() => {
    const roomRef = database.ref(`rooms/${roomId}`);

    roomRef.on('value', room => {
      const databaseRoom = room.val();
      const firebaseQuestions: FirebaseQuestions = databaseRoom.questions ?? {};

      const parsedQuestions = Object.entries(firebaseQuestions).map(([key, value]) => {
        return {
          id: key,
          content: value.content,
          author: value.author,
          isHighlighted: value.isHighlighted,
          isAnswered: value.isAnswered
        }
      });

      setTitle(databaseRoom.title);
      setQuestions(parsedQuestions);
    });
  }, [roomId]);

  async function handleSendleQuestion(e: FormEvent) {
    e.preventDefault()

    if (newQuestion.trim() === '') {
      return;
    };

    if (!user) {
      throw new Error('You must be logged in');
    };

    const question = {
      content: newQuestion,
      author: {
        name: user.name,
        avatar: user.avatar
      },
      isHighlighted: false,
      isAnswered: false
    };

    await database.ref(`rooms/${roomId}/questions`).push(question);

    setNewQuestion('');
  };

  return (
    <div id='page-room'>
      <header>
        <div className='content'>
          <img src={logoImg} alt="Letmeask" />
          <RoomCode code={roomId}/>
        </div>
      </header>

      <main>
        <div className="room-title">
          <h1>Sala { title }</h1>
          { questions.length > 0 && (
            <span>{ questions.length } pergunta(s)</span>
          ) }
        </div>

        <form onSubmit={e => handleSendleQuestion(e)}>
          <textarea 
            placeholder="O que você quer perguntar?"
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
          />

          <div className="form-footer">
            { user ?
              (
                <div className='user-info'>
                  <img src={user.avatar} alt={user.name}/>
                  <span>{user.name}</span>
                </div>
              ) : (
                <span>Para enviar uma pergunta, <button>faça seu login</button>.</span>
              )
            }
            <Button type="submit" disabled={!user}>Enviar pergunta</Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export { Room };
