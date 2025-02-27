import { passwordExistRequest, passwordLoginRequest } from '@/api/auth';
import request from '@/services/request';
import useSessionStore from '@/stores/session';
import { ApiResp, Session } from '@/types';
import { TUserExist } from '@/types/user';
import { Flex, Image, Img, Input, InputGroup, InputLeftAddon, Text } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import lockIcon from 'public/images/lock.svg';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function usePassword({
  showError
}: {
  showError: (errorMessage: string, duration?: number) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [userExist, setUserExist] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  // 对于注册的用户，需要先验证密码 0 默认页面;1为验证密码页面
  const [pageState, setPageState] = useState(0);

  const setSession = useSessionStore((s) => s.setSession);

  const { register, handleSubmit, watch, trigger, getValues } = useForm<{
    username: string;
    password: string;
    confimPassword: string;
  }>();

  const login = async () => {
    const deepSearch = (obj: any): string => {
      if (!obj || typeof obj !== 'object') return t('Submit Error');
      if (!!obj.message) {
        return obj.message;
      }
      return deepSearch(Object.values(obj)[0]);
    };

    handleSubmit(
      async (data) => {
        if (data?.username && data?.password) {
          try {
            setIsLoading(true);
            const inviterId = localStorage.getItem('inviterId');
            const result = await passwordExistRequest({ user: data.username });
            if (result?.code === 200) {
              const result = await passwordLoginRequest({
                user: data.username,
                password: data.password
              });
              setSession(result.data!);
              router.replace('/');
              return;
            }
            if (result?.code === 201) {
              setUserExist(!!result?.data?.exist);
              setPageState(1);
              if (!!data?.confimPassword) {
                if (data?.password !== data?.confimPassword) {
                  showError('password not match');
                } else {
                  const result = await request.post<any, ApiResp<Session>>('/api/auth/password', {
                    user: data.username,
                    password: data.password,
                    inviterId
                  });
                  setSession(result.data!);
                  router.replace('/');
                }
              }
            }
          } catch (error: any) {
            console.log(error);
            showError(t('Invalid username or password'));
          } finally {
            setIsLoading(false);
          }
        }
      },
      (err) => {
        console.log(err);
        showError(deepSearch(err));
      }
    )();
  };

  const PasswordComponent = () => {
    if (pageState === 0) {
      return <PasswordModal />;
    } else {
      return <ConfirmPasswordModal />;
    }
  };

  const PasswordModal = () => {
    return (
      <>
        <InputGroup
          variant={'unstyled'}
          bg="rgba(255, 255, 255, 0.65)"
          mt={'20px'}
          width="266px"
          minH="42px"
          mb="14px"
          borderRadius="4px"
          p="10px"
          border="1px solid #E5E5E5"
        >
          <InputLeftAddon>
            <Image alt="person" src={'/images/person.svg'} onClick={() => setUserExist(true)} />
          </InputLeftAddon>
          <Input
            type="text"
            placeholder={t('Username') || ''}
            pl={'12px'}
            variant={'unstyled'}
            fontSize="14px"
            id="username"
            fontWeight="400"
            _autofill={{
              backgroundColor: 'transparent !important',
              backgroundImage: 'none !important'
            }}
            {...register('username', {
              pattern: {
                value: /^[a-zA-Z0-9_-]{3,16}$/,
                message: 'username tips'
              },
              required: true
            })}
          />
        </InputGroup>
        <InputGroup
          variant={'unstyled'}
          bg="rgba(255, 255, 255, 0.65)"
          width="266px"
          minH="42px"
          mb="14px"
          borderRadius="4px"
          p="10px"
          border="1px solid #E5E5E5"
        >
          <InputLeftAddon>
            <Image alt="person" src={'images/lock.svg'} />
          </InputLeftAddon>
          <Input
            type="password"
            placeholder={t('Password') || ''}
            pl={'12px'}
            variant={'unstyled'}
            fontSize="14px"
            id="password"
            fontWeight="400"
            _autofill={{
              backgroundColor: 'transparent !important',
              backgroundImage: 'none !important'
            }}
            {...register('password', {
              pattern: {
                value: /^(?=.*\S).{8,}$/,
                message: 'password tips'
              },
              required: true
            })}
          />
        </InputGroup>
      </>
    );
  };

  const ConfirmPasswordModal = () => {
    return (
      <>
        <Flex p={'0'} alignItems={'center'} width="266px" minH="42px" mb="14px" borderRadius="4px">
          <Image
            color={'#FFFFFF'}
            src="/images/Vector.svg"
            w={'20px'}
            transform={'rotate(-90deg)'}
            h={'20px'}
            mr={'16px'}
            display={'inline-block'}
            verticalAlign={'middle'}
            cursor={'pointer'}
            alt="Vector"
            onClick={() => setPageState(0)}
          />
          <Text color={'#FFFFFF'}>{t('Verify password')}</Text>
        </Flex>
        <InputGroup
          variant={'unstyled'}
          bg="rgba(255, 255, 255, 0.65)"
          width="266px"
          minH="42px"
          mb="14px"
          borderRadius="4px"
          p="10px"
          border="1px solid #E5E5E5"
        >
          <InputLeftAddon>
            <Img src={lockIcon.src}></Img>
          </InputLeftAddon>
          <Input
            type="password"
            placeholder={t('Verify password') || 'Verify password'}
            pl={'12px'}
            fontSize="14px"
            id="repassword"
            fontWeight="400"
            variant={'unstyled'}
            _autofill={{
              backgroundColor: 'transparent !important',
              backgroundImage: 'none !important'
            }}
            {...register('confimPassword', {
              pattern: {
                value: /^(?=.*\S).{8,}$/,
                message: 'password tips'
              },
              required: true
            })}
          />
        </InputGroup>
      </>
    );
  };

  return {
    PasswordComponent,
    login,
    userExist,
    pageState,
    isLoading
  };
}
