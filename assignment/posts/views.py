from requests import post, request
from app.models import User
from django.db.models import Q
from rest_framework.generics import UpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from drf_spectacular.utils import extend_schema
from .serializer import ProfileSerializer,PostSerializer, UserList, followers,likeserializer,commentserializer
from .models import Follow, Post, Comment
from rest_framework.generics import (

    ListAPIView,
    RetrieveAPIView,
    DestroyAPIView,
    CreateAPIView
)
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q

from rest_framework.generics import (
    CreateAPIView,
    RetrieveUpdateDestroyAPIView,
    ListAPIView,
)

class ProfileView(UpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    http_method_names = ["get", "put"]

    def get_object(self):
        return self.request.user

    def get(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return Response(serializer.data)

@extend_schema(
    request=PostSerializer,
    responses=PostSerializer,
)
class CreatePost(CreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        extra = {"user": self.request.user}
        image = self.request.FILES.get("image")
        if image:
            extra["image"] = image
        serializer.save(**extra)


class ListPosts(ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Post.objects.select_related("user")
            .prefetch_related("images", "hashtags")
            .order_by("-created_at")
        )
    
class RetrievePost(RetrieveAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

class UpdatePost(UpdateAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    http_method_names = ["put", "patch"]

    def get_queryset(self):
        return Post.objects.filter(user=self.request.user)

    def get_serializer(self, *args, **kwargs):
        kwargs["partial"] = True
        return super().get_serializer(*args, **kwargs)

    def perform_update(self, serializer):
        image = self.request.FILES.get("image")
        if image:
            serializer.save(image=image)
        else:
            serializer.save()


class DeletePost(DestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Post.objects.filter(user=self.request.user)



class Feed(ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        following = Follow.objects.filter(
            follower=self.request.user
        ).values_list("following", flat=True)

        followers = Follow.objects.filter(
            following=self.request.user
        ).values_list("follower", flat=True)

        posts = (
            Post.objects.select_related("user")
            .prefetch_related("images", "hashtags")
            .filter(
                Q(user=self.request.user)
                | Q(user__in=following, visibility="public")
                | Q(user__in=followers, visibility="public")
            )
            .distinct()
            .order_by("-created_at")
        )

        return posts

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)   # <-- Ye line missing th


class Likes(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        post =Post.objects.get(id=pk)
        user = request.user
        print(user)
        if post.likes.filter(id=user.id).exists():
            post.likes.remove(user)
            liked = False
            return Response({"message": "Post dislike"})
        else:
            post.likes.add(user)
            liked = True
            return Response({"message": "Post liked"})


class CommentCreate(CreateAPIView):
    serializer_class = commentserializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        post = Post.objects.get(id=kwargs["pk"])

        serializer.save(
            user=request.user,
            post=post
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ListVerifiedUser(ListAPIView):
    serializer_class = UserList
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(is_verified=True)

class MakeFollower(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = User.objects.get(id=pk)

        follow = Follow.objects.filter(
            follower=request.user,
            following=user
        )

        if follow.exists():
            follow.delete()
            return Response(
                {"message": "You have unfollowed the user."},
                status=status.HTTP_200_OK
            )

        Follow.objects.create(
            follower=request.user,
            following=user
        )

        return Response(
            {"message": f"You are now following {user.name}"},
            status=status.HTTP_201_CREATED
        )

        
