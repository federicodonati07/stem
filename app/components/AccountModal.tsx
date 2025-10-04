'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Tabs, Tab, Divider } from '@heroui/react';
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles, Palette, Heart } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountModal = ({ isOpen, onClose }: AccountModalProps) => {
  const [selectedTab, setSelectedTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for future backend integration
    console.log('Form submitted:', formData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          size="lg"
          classNames={{
            base: "bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-2xl",
            backdrop: "bg-black/60 backdrop-blur-md"
          }}
        >
          <ModalContent>
            {(onClose) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative overflow-hidden"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236366f1' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
                  }} />
                </div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ 
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-8 right-8 w-6 h-6 bg-purple-200 rounded-full opacity-60"
                />
                <motion.div
                  animate={{ 
                    y: [0, 8, 0],
                    rotate: [0, -3, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                  }}
                  className="absolute bottom-12 left-8 w-4 h-4 bg-blue-200 rounded-full opacity-60"
                />
                <motion.div
                  animate={{ 
                    y: [0, -6, 0],
                    x: [0, 3, 0]
                  }}
                  transition={{ 
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute top-1/2 right-12 w-3 h-3 bg-pink-200 rounded-full opacity-60"
                />

                {/* Gradient Overlay */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600" />

                <ModalHeader className="flex flex-col gap-1 relative pb-2">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">S</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          {selectedTab === 'login' ? 'Benvenuto' : 'Unisciti a Stem'}
                        </h2>
                        <p className="text-gray-600 text-sm">
                          {selectedTab === 'login' 
                            ? 'Accedi al tuo account per continuare' 
                            : 'Crea un nuovo account per iniziare'
                          }
                        </p>
                      </div>
                    </div>
                    <Button
                      isIconOnly
                      variant="ghost"
                      size="sm"
                      onPress={onClose}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                    >
                      <X size={20} />
                    </Button>
                  </div>
                </ModalHeader>

                <ModalBody className="px-6 py-4">
                  <Tabs
                    selectedKey={selectedTab}
                    onSelectionChange={(key) => setSelectedTab(key as string)}
                    className="w-full"
                    classNames={{
                      tabList: "w-full relative rounded-xl p-1 bg-gray-100/50",
                      cursor: "w-full bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg",
                      tab: "max-w-fit px-6 h-10 rounded-lg font-medium",
                      tabContent: "group-data-[selected=true]:text-white text-gray-600"
                    }}
                  >
                    <Tab key="login" title="Accedi" />
                    <Tab key="register" title="Registrati" />
                  </Tabs>

                  <form onSubmit={handleSubmit} className="space-y-5 mt-6">
                    {selectedTab === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Input
                          type="text"
                          label="Nome completo"
                          placeholder="Inserisci il tuo nome"
                          value={formData.name}
                          onValueChange={(value) => handleInputChange('name', value)}
                          startContent={<User size={18} className="text-purple-500" />}
                          classNames={{
                            input: "text-gray-900 font-medium",
                            inputWrapper: "border-gray-200 hover:border-purple-300 focus-within:border-purple-500 bg-white/80 backdrop-blur-sm shadow-sm",
                            label: "text-gray-700 font-medium"
                          }}
                          required
                        />
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <Input
                        type="email"
                        label="Email"
                        placeholder="Inserisci la tua email"
                        value={formData.email}
                        onValueChange={(value) => handleInputChange('email', value)}
                        startContent={<Mail size={18} className="text-purple-500" />}
                        classNames={{
                          input: "text-gray-900 font-medium",
                          inputWrapper: "border-gray-200 hover:border-purple-300 focus-within:border-purple-500 bg-white/80 backdrop-blur-sm shadow-sm",
                          label: "text-gray-700 font-medium"
                        }}
                        required
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <Input
                        type={showPassword ? "text" : "password"}
                        label="Password"
                        placeholder="Inserisci la tua password"
                        value={formData.password}
                        onValueChange={(value) => handleInputChange('password', value)}
                        startContent={<Lock size={18} className="text-purple-500" />}
                        endContent={
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400 hover:text-purple-600 transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        }
                        classNames={{
                          input: "text-gray-900 font-medium",
                          inputWrapper: "border-gray-200 hover:border-purple-300 focus-within:border-purple-500 bg-white/80 backdrop-blur-sm shadow-sm",
                          label: "text-gray-700 font-medium"
                        }}
                        required
                      />
                    </motion.div>

                    {selectedTab === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                      >
                        <Input
                          type={showPassword ? "text" : "password"}
                          label="Conferma password"
                          placeholder="Conferma la tua password"
                          value={formData.confirmPassword}
                          onValueChange={(value) => handleInputChange('confirmPassword', value)}
                          startContent={<Lock size={18} className="text-purple-500" />}
                          classNames={{
                            input: "text-gray-900 font-medium",
                            inputWrapper: "border-gray-200 hover:border-purple-300 focus-within:border-purple-500 bg-white/80 backdrop-blur-sm shadow-sm",
                            label: "text-gray-700 font-medium"
                          }}
                          required
                        />
                      </motion.div>
                    )}

                    {selectedTab === 'login' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                        className="flex items-center justify-between"
                      >
                        <label className="flex items-center space-x-2 text-sm text-gray-600">
                          <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                          <span>Ricordami</span>
                        </label>
                        <a href="#" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                          Password dimenticata?
                        </a>
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                        size="lg"
                      >
                        {selectedTab === 'login' ? 'Accedi al tuo account' : 'Crea il tuo account'}
                      </Button>
                    </motion.div>
                  </form>

                  {selectedTab === 'login' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                      className="mt-8"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-white text-gray-500 font-medium">Oppure continua con</span>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <Button
                          variant="bordered"
                          className="border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
                          startContent={
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                          }
                        >
                          Google
                        </Button>
                        <Button
                          variant="bordered"
                          className="border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
                          startContent={
                            <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          }
                        >
                          Facebook
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </ModalBody>

                <ModalFooter className="justify-center py-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                    className="text-center"
                  >
                    <p className="text-sm text-gray-600">
                      {selectedTab === 'login' ? (
                        <>
                          Non hai un account?{' '}
                          <button
                            onClick={() => setSelectedTab('register')}
                            className="text-purple-600 hover:text-purple-700 font-semibold transition-colors duration-200"
                          >
                            Registrati ora
                          </button>
                        </>
                      ) : (
                        <>
                          Hai già un account?{' '}
                          <button
                            onClick={() => setSelectedTab('login')}
                            className="text-purple-600 hover:text-purple-700 font-semibold transition-colors duration-200"
                          >
                            Accedi qui
                          </button>
                        </>
                      )}
                    </p>
                    <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-gray-500">
                      <Heart size={12} className="text-red-500" />
                      <span>Fatto con passione per la creatività</span>
                    </div>
                  </motion.div>
                </ModalFooter>
              </motion.div>
            )}
          </ModalContent>
        </Modal>
      )}
    </AnimatePresence>
  );
};

export default AccountModal;
