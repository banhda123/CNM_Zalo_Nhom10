import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Checkbox,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import UserService from '../services/UserService';
import ChatService from '../services/ChatService';
import AuthService from '../services/AuthService';

const CreateGroupDialog = ({ open, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Fetch friends when dialog opens
  useEffect(() => {
    if (open) {
      fetchFriends();
    }
  }, [open]);

  // Filter friends based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(friend =>
        friend.idUser.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  }, [searchQuery, friends]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const userData = AuthService.getUserData();
      if (!userData || !userData._id) {
        throw new Error('User not authenticated');
      }

      const response = await UserService.getAllFriends(userData._id);
      setFriends(response || []);
      setFilteredFriends(response || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setError('Failed to load friends list');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFriend = (friendId) => {
    setSelectedFriends(prevSelected => {
      if (prevSelected.includes(friendId)) {
        return prevSelected.filter(id => id !== friendId);
      } else {
        return [...prevSelected, friendId];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Vui lòng nhập tên nhóm');
      return;
    }

    if (selectedFriends.length < 2) {
      setError('Vui lòng chọn ít nhất 2 bạn bè');
      return;
    }

    try {
      setCreating(true);
      setError('');
      
      const userData = AuthService.getUserData();
      const token = AuthService.getAccessToken();
      
      if (!token) {
        setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
        return;
      }
      
      const groupData = {
        name: groupName.trim(),
        members: selectedFriends
      };

      const response = await ChatService.createGroupConversation(groupData, token);
      
      if (response.success) {
        onGroupCreated(response.conversation);
        handleClose();
      } else {
        setError(response.message || 'Không thể tạo nhóm');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Không thể tạo nhóm. Vui lòng thử lại.');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSearchQuery('');
    setSelectedFriends([]);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Tạo nhóm mới
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <TextField
          autoFocus
          margin="dense"
          label="Tên nhóm"
          type="text"
          fullWidth
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          error={!!error && !groupName.trim()}
          helperText={!groupName.trim() && error ? 'Vui lòng nhập tên nhóm' : ''}
          sx={{ mb: 2 }}
        />
        
        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
          Chọn bạn bè (ít nhất 2 người)
        </Typography>
        
        <TextField
          fullWidth
          placeholder="Tìm kiếm bạn bè..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
          sx={{ mb: 2 }}
        />
        
        {error && selectedFriends.length < 2 && (
          <Typography color="error" variant="caption" sx={{ display: 'block', mb: 1 }}>
            Vui lòng chọn ít nhất 2 bạn bè
          </Typography>
        )}
        
        {loading ? (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress size={40} />
          </Box>
        ) : friends.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ my: 2 }}>
            Bạn chưa có bạn bè nào. Hãy thêm bạn bè để tạo nhóm.
          </Typography>
        ) : (
          <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'background.paper' }}>
            {filteredFriends.map((friend) => (
              <ListItem 
                key={friend.idUser._id}
                dense
                disablePadding
                onClick={() => handleToggleFriend(friend.idUser._id)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': { bgcolor: 'action.hover' },
                  bgcolor: selectedFriends.includes(friend.idUser._id) ? 'action.selected' : 'transparent'
                }}
              >
                <Checkbox
                  edge="start"
                  checked={selectedFriends.includes(friend.idUser._id)}
                  tabIndex={-1}
                  disableRipple
                />
                <ListItemAvatar>
                  <Avatar src={friend.idUser.avatar} alt={friend.idUser.name} />
                </ListItemAvatar>
                <ListItemText 
                  primary={friend.idUser.name}
                  secondary={friend.idUser.phone}
                />
              </ListItem>
            ))}
          </List>
        )}
        
        {error && !error.includes('Please select') && !error.includes('Group name') && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Hủy</Button>
        <Button 
          onClick={handleCreateGroup} 
          color="primary" 
          variant="contained"
          disabled={creating || selectedFriends.length < 2 || !groupName.trim()}
        >
          {creating ? <CircularProgress size={24} /> : 'Tạo nhóm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateGroupDialog;
