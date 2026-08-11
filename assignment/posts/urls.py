from django.urls import path
from .views import Feed, Likes, ListVerifiedUser, MakeFollower, ProfileView

from .views import CreatePost, ListPosts, RetrievePost, UpdatePost, DeletePost, CommentCreate
urlpatterns = [
    path("profile/", ProfileView.as_view(), name="profile"),
    path("posts/create/", CreatePost.as_view(), name="create-post"),
    path("posts/list/", ListPosts.as_view(), name="list-posts"),
    path("posts/<uuid:pk>/", RetrievePost.as_view(), name="retrieve-post"),
    path("posts/<uuid:pk>/update/", UpdatePost.as_view(), name="update-post"),
    path("posts/<uuid:pk>/delete/", DeletePost.as_view(), name="delete-post"),

    path("posts/<uuid:pk>/like/", Likes.as_view(), name="like-post"),
    path("feed/", Feed.as_view(), name="feed"),
    path("posts/<uuid:pk>/like/", Likes.as_view(), name="like"),
    path("posts/<uuid:pk>/comment/", CommentCreate.as_view(), name="comment"),
    path("verified-users/", ListVerifiedUser.as_view(), name="verified-users"),
    path("follow/<int:pk>/", MakeFollower.as_view(), name="make-follower"),
]