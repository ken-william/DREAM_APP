from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from social.models import FriendRequest

User = get_user_model()

class FriendRequestTestCase(TestCase):
    def setUp(self):
        """Setup des utilisateurs de test"""
        self.alice = User.objects.create_user(
            username='alice',
            email='alice@test.com',
            password='Password123!'
        )
        self.bob = User.objects.create_user(
            username='bob', 
            email='bob@test.com',
            password='Password123!'
        )
        self.charlie = User.objects.create_user(
            username='charlie',
            email='charlie@test.com', 
            password='Password123!'
        )
        self.client = APIClient()

    def authenticate_as(self, user):
        """Helper pour authentification"""
        self.client.force_authenticate(user=user)

    def test_send_friend_request_success(self):
        """Test envoi demande d'ami réussie"""
        self.authenticate_as(self.alice)
        response = self.client.post(f'/api/social/friend-request/{self.bob.username}/')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            FriendRequest.objects.filter(
                from_user=self.alice,
                to_user=self.bob,
                status='pending'
            ).exists()
        )

    def test_cannot_send_request_to_self(self):
        """Test impossible de s'ajouter soi-même"""
        self.authenticate_as(self.alice)
        response = self.client.post(f'/api/social/friend-request/{self.alice.username}/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_send_duplicate_request(self):
        """Test impossible d'envoyer une demande en double"""
        # Créer une demande existante
        FriendRequest.objects.create(
            from_user=self.alice,
            to_user=self.bob,
            status='pending'
        )
        
        self.authenticate_as(self.alice)
        response = self.client.post(f'/api/social/friend-request/{self.bob.username}/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_view_pending_requests(self):
        """Test consultation des demandes reçues"""
        # Créer une demande
        FriendRequest.objects.create(
            from_user=self.alice,
            to_user=self.bob,
            status='pending'
        )
        
        self.authenticate_as(self.bob)
        response = self.client.get('/api/social/requests/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['from']['username'], 'alice')

    def test_accept_friend_request(self):
        """Test acceptation d'une demande d'ami"""
        # Créer une demande
        fr = FriendRequest.objects.create(
            from_user=self.alice,
            to_user=self.bob,
            status='pending'
        )
        
        self.authenticate_as(self.bob)
        response = self.client.post(f'/api/social/respond/{fr.id}/accept/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        fr.refresh_from_db()
        self.assertEqual(fr.status, 'accepted')

    def test_reject_friend_request(self):
        """Test rejet d'une demande d'ami"""
        # Créer une demande
        fr = FriendRequest.objects.create(
            from_user=self.alice,
            to_user=self.bob,
            status='pending'
        )
        
        self.authenticate_as(self.bob)
        response = self.client.post(f'/api/social/respond/{fr.id}/reject/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        fr.refresh_from_db()
        self.assertEqual(fr.status, 'rejected')

    def test_get_friends_list(self):
        """Test récupération de la liste d'amis"""
        # Créer une amitié acceptée
        FriendRequest.objects.create(
            from_user=self.alice,
            to_user=self.bob,
            status='accepted'
        )
        
        self.authenticate_as(self.alice)
        response = self.client.get('/api/social/friends/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = [friend['username'] for friend in response.data]
        self.assertIn('bob', usernames)
        self.assertNotIn('charlie', usernames)

    def test_remove_friend(self):
        """Test suppression d'un ami"""
        # Créer une amitié acceptée
        FriendRequest.objects.create(
            from_user=self.alice,
            to_user=self.bob,
            status='accepted'
        )
        
        self.authenticate_as(self.alice)
        response = self.client.post(f'/api/social/remove-friend/{self.bob.username}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(
            FriendRequest.objects.filter(
                from_user=self.alice,
                to_user=self.bob,
                status='accepted'
            ).exists()
        )

    def test_invalid_action_response(self):
        """Test action invalide sur demande d'ami"""
        fr = FriendRequest.objects.create(
            from_user=self.alice,
            to_user=self.bob,
            status='pending'
        )
        
        self.authenticate_as(self.bob)
        response = self.client.post(f'/api/social/respond/{fr.id}/invalid_action/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_respond_to_others_request(self):
        """Test qu'on ne peut pas répondre à la demande de quelqu'un d'autre"""
        fr = FriendRequest.objects.create(
            from_user=self.alice,
            to_user=self.bob,
            status='pending'
        )
        
        # Charlie essaie de répondre à la demande alice->bob
        self.authenticate_as(self.charlie)
        response = self.client.post(f'/api/social/respond/{fr.id}/accept/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class SocialSearchTestCase(TestCase):
    def setUp(self):
        self.alice = User.objects.create_user(
            username='alice',
            email='alice@test.com',
            password='Password123!'
        )
        self.bob = User.objects.create_user(
            username='bob_test',
            email='bob@test.com', 
            password='Password123!'
        )
        self.client = APIClient()

    def test_search_users(self):
        """Test recherche d'utilisateurs"""
        self.client.force_authenticate(user=self.alice)
        response = self.client.get('/api/social/search/?q=bob')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = [user['username'] for user in response.data]
        self.assertIn('bob_test', usernames)
        self.assertNotIn('alice', usernames)  # Pas soi-même

    def test_search_empty_query(self):
        """Test recherche avec query vide"""
        self.client.force_authenticate(user=self.alice)
        response = self.client.get('/api/social/search/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])


class MessageTestCase(TestCase):
    def setUp(self):
        self.alice = User.objects.create_user(
            username='alice',
            email='alice@test.com',
            password='Password123!'
        )
        self.bob = User.objects.create_user(
            username='bob',
            email='bob@test.com',
            password='Password123!'
        )
        # Créer une amitié pour permettre les messages
        FriendRequest.objects.create(
            from_user=self.alice,
            to_user=self.bob,
            status='accepted'
        )
        self.client = APIClient()

    def test_send_message_to_friend(self):
        """Test envoi de message à un ami"""
        self.client.force_authenticate(user=self.alice)
        response = self.client.post(f'/api/social/messages/send/{self.bob.username}/', {
            'text': 'Hello Bob!',
            'message_type': 'text'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['text'], 'Hello Bob!')

    def test_get_messages_with_friend(self):
        """Test récupération des messages avec un ami"""
        # Envoyer un message d'abord
        self.client.force_authenticate(user=self.alice)
        self.client.post(f'/api/social/messages/send/{self.bob.username}/', {
            'text': 'Hello Bob!',
            'message_type': 'text'
        })
        
        # Récupérer les messages
        response = self.client.get(f'/api/social/messages/{self.bob.username}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['text'], 'Hello Bob!')

    def test_cannot_message_non_friend(self):
        """Test impossible d'envoyer un message à un non-ami"""
        charlie = User.objects.create_user(
            username='charlie',
            email='charlie@test.com',
            password='Password123!'
        )
        
        self.client.force_authenticate(user=self.alice)
        response = self.client.post(f'/api/social/messages/send/{charlie.username}/', {
            'text': 'Hello Charlie!',
            'message_type': 'text'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
